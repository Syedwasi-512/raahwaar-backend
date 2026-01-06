const asyncHandler = require("express-async-handler");
const Product = require("../models/Product_Models/Product");
const ProductImage = require("../models/Product_Models/ProductImage");
const cloudinary = require("../utils/cloudinary");

// @desc    Get all products with images (Optimized)
// @route   GET /api/products
exports.getAllProduct = asyncHandler(async (req, res) => {
  // 1. Fetch Products (Lean for performance)
  const products = await Product.find()
    .populate("genderId typeId brandId conditionId", "name")
    .populate("sizeId", "value")
    .populate("colorId", "name hex")
    .sort({ createdAt: -1 })
    .lean();

  if (!products || products.length === 0) {
    return res.status(200).json([]);
  }

  // 2. Fetch All Images in One Go
  const productIds = products.map((p) => p._id);
  const allImages = await ProductImage.find({ 
    productId: { $in: productIds } 
  }).lean();

  // 3. Merge Images AND Calculate finalPrice
  const productsWithImages = products.map((p) => {
    // --- FINAL PRICE CALCULATION LOGIC ---
    const discount = p.discountPercent || 0;
    const price = p.price || 0;
    const finalPrice = discount > 0 
      ? price - (price * discount) / 100 
      : price;

    return {
      ...p,
      finalPrice: Math.round(finalPrice), // Rounding for clean currency display
      images: allImages.filter(
        (img) => img.productId?.toString() === p._id.toString()
      ),
    };
  });

  res.status(200).json(productsWithImages);
});

// @desc    Create product
// @route   POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, price, quantity, featured } = req.body;

  // Basic Validation
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("At least one image is required");
  }

  // Create Product
  const newProduct = await Product.create({
    ...req.body,
    featured: featured === "true" || featured === true,
  });

  // Prepare images data
  const imagesData = req.files.map((file) => ({
    productId: newProduct._id,
    url: file.path,
    public_id: file.filename,
  }));

  await ProductImage.insertMany(imagesData);

  res.status(201).json({ success: true, message: "Product created successfully" });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Find images to delete from Cloudinary
  const images = await ProductImage.find({ productId: req.params.id });
  
  // Parallel deletion for speed
  const deleteCloudinary = images.map((img) => cloudinary.uploader.destroy(img.public_id));
  await Promise.all(deleteCloudinary);

  // DB deletion
  await ProductImage.deleteMany({ productId: req.params.id });
  await product.deleteOne();

  res.status(200).json({ success: true, message: "Product deleted successfully" });
});

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Handle Image Removal
  if (req.body.removedImages) {
    const removedIds = JSON.parse(req.body.removedImages);
    if (removedIds.length > 0) {
      const deletePromises = removedIds.map(id => cloudinary.uploader.destroy(id));
      await Promise.all(deletePromises);
      await ProductImage.deleteMany({ public_id: { $in: removedIds } });
    }
  }

  // Handle New Images Upload
  if (req.files && req.files.length > 0) {
    const existingCount = await ProductImage.countDocuments({ productId: req.params.id });
    if (existingCount + req.files.length > 8) {
      res.status(400);
      throw new Error(`Limit exceeded. Max 8 images allowed.`);
    }

    const newImages = req.files.map(file => ({
      productId: req.params.id,
      url: file.path,
      public_id: file.filename,
    }));
    await ProductImage.insertMany(newImages);
  }

  // Professional way to update fields
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updatedProduct });
});