const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const Product = require("../models/Product_Models/Product");
const ProductImage = require("../models/Product_Models/ProductImage");
const db = require("../models/Product_Models/index");
const COOKIE_OPTIONS = require("../config/cookieConfig");

// --- HELPER: Fast & Clean Cart Builder ---
const buildCleanCart = async (cart) => {
  if (!cart || !cart.items.length) {
    return { cart: { _id: cart?._id, items: [] }, total: 0 };
  }

  // 1. Get all product IDs in the cart
  const productIds = cart.items.map(
    (item) => item.productId._id || item.productId
  );

  // 2. Fetch all images for these products in ONE query
  const images = await ProductImage.find({
    productId: { $in: productIds },
  }).lean();

  const items = cart.items
    .map((item) => {
      const product = item.productId; // This is the populated product object
      if (!product) return null;

      // Calculate dynamic price
      const finalPrice =
        product.discountPercent > 0
          ? product.price - (product.price * product.discountPercent) / 100
          : product.price;

      // Find the specific image from our pre-fetched list
      const productImg = images.find(
        (img) => img.productId.toString() === product._id.toString()
      );

      return {
        _id: item._id,
        quantity: item.quantity,
        productId: product._id,
        finalPrice: finalPrice,
        product: {
          title: product.title,
          price: product.price,
          discountPercent: product.discountPercent,
          image: productImg?.url || null,
          brand: product.brandId?.name,
          size: product.sizeId?.value,
          color: product.colorId?.name,
          condition: product.conditionId?.name,
          stock: product.quantity,
        },
      };
    })
    .filter(Boolean); // Remove nulls if any product was deleted from DB

  const total = items.reduce(
    (sum, item) => sum + item.finalPrice * item.quantity,
    0
  );

  return { cart: { _id: cart._id, items }, total };
};

// --- CONTROLLERS ---

// @desc    Get User Cart
// @route   GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  if (!req.cart) return res.json({ cart: { items: [] }, total: 0 });

  const cart = await Cart.findById(req.cart._id).populate({
    path: "items.productId",
    populate: {
      path: "brandId sizeId colorId conditionId",
      select: "name value",
    },
  });

  const response = await buildCleanCart(cart);
  res.status(200).json(response);
});

// @desc    Add Item to Cart
// @route   POST /api/cart/add
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  let cart = req.cart;

  // 1. If no cart exists, create one
  if (!cart) {
    cart = await Cart.create({ items: [] });
    res.cookie("cartId", cart._id.toString(), {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
    });
  }

  // 2. Stock Check
  const product = await Product.findById(productId).lean();
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.quantity < quantity) {
    res.status(400);
    throw new Error(`Only ${product.quantity} items left in stock`);
  }

  const currentPrice =
    product.discountPercent > 0
      ? product.price - (product.price * product.discountPercent) / 100
      : product.price;

  // 3. Update Cart logic (Atomic check)
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + quantity;
    if (newQty > product.quantity) {
      cart.items[existingItemIndex].quantity = product.quantity; // Cap at max stock
    } else {
      cart.items[existingItemIndex].quantity = newQty;
    }

    // Price update (Taake agar admin ne price badli ho toh cart update ho jaye)
    cart.items[existingItemIndex].price = currentPrice;
  } else {
    cart.items.push({ productId, quantity: Number(quantity) , price: currentPrice });
  }

  await cart.save();

  // 4. Return Populated Cart
  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.productId",
    populate: {
      path: "brandId sizeId colorId conditionId",
      select: "name value",
    },
  });

  res.status(200).json(await buildCleanCart(populatedCart));
});

// @desc    Update Item Quantity
// @route   PUT /api/cart/update
exports.updateItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // 1. SECURITY & CRASH PREVENTION: Check if req.cart exists
  if (!req.cart || !req.cart._id) {
    res.status(404);
    throw new Error("Your cart session has expired. Please refresh the page.");
  }

  // 2. FETCH CART: Direct fetch from ID
  const cart = await Cart.findById(req.cart._id);
  if (!cart) {
    res.status(404);
    throw new Error("Cart not found in database.");
  }

  // 3. PRODUCT VALIDATION: Check if product exists and check stock
  const product = await Product.findById(productId).lean();
  if (!product) {
    res.status(404);
    throw new Error("Product no longer exists.");
  }

  // 4. QUANTITY LOGIC
  const targetQuantity = Number(quantity);

  if (targetQuantity <= 0) {
    // If quantity is 0 or less, remove the item
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
  } else {
    // Stock Check
    if (product.quantity < targetQuantity) {
      res.status(400);
      throw new Error(`Only ${product.quantity} pairs remaining in stock.`);
    }

    // Find item and update quantity & price (Price sync zaroori hai)
    const itemIndex = cart.items.findIndex(it => it.productId.toString() === productId);
    
    if (itemIndex > -1) {
      const discount = product.discountPercent || 0;
      const basePrice = product.price || 0;
      const finalPrice = discount > 0 ? Math.round(basePrice - (basePrice * discount / 100)) : basePrice;

      cart.items[itemIndex].quantity = targetQuantity;
      cart.items[itemIndex].price = finalPrice; // Ensure price is always correct
    } else {
      res.status(404);
      throw new Error("Item not found in your cart.");
    }
  }

  // 5. SAVE & POPULATE
  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate({
    path: "items.productId",
    populate: {
      path: "brandId sizeId colorId conditionId",
      select: "name value",
    },
  });

  // 6. RESPONSE: Build clean structure using the helper we made
  const response = await buildCleanCart(populatedCart);
  res.status(200).json(response);
});

// @desc    Remove Specific Item from Cart
// @route   POST /api/cart/remove
exports.removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  // 1. DEFENSIVE CHECK: Agar req.cart null hai toh crash na karo
  if (!req.cart || !req.cart._id) {
    return res.status(200).json({ 
      success: true, 
      cart: { items: [] }, 
      total: 0,
      message: "Cart session not found" 
    });
  }

  // 2. ATOMIC REMOVAL: Use MongoDB $pull for high-speed removal
  const updatedCart = await Cart.findByIdAndUpdate(
    req.cart._id,
    { $pull: { items: { productId: productId } } },
    { new: true } // Taake humein update hone ke baad wala cart mile
  ).populate({
    path: "items.productId",
    populate: {
      path: "brandId sizeId colorId conditionId",
      select: "name value",
    },
  });

  // 3. CLEANUP: Agar update ke baad cart galti se null ho jaye
  if (!updatedCart) {
    return res.status(200).json({ cart: { items: [] }, total: 0 });
  }

  // 4. RESPONSE: Build clean structure for frontend
  res.json(await buildCleanCart(updatedCart));
});

// @desc    Clear All Cart
// @route   POST /api/cart/clear
// @desc    Clear All items from Cart
// @route   POST /api/cart/clear
exports.clearCart = asyncHandler(async (req, res) => {
  // 1. Defensive Check: Agar cart pehle hi nahi hai toh crash na karo
  if (!req.cart || !req.cart._id) {
    return res.status(200).json({ 
      success: true, 
      cart: { items: [] }, 
      total: 0,
      message: "Cart was already empty" 
    });
  }

  // 2. Database Update: Direct ID use karein
  await Cart.findByIdAndUpdate(req.cart._id, { 
    $set: { items: [] } 
  });

  // 3. Clean Response
  res.status(200).json({ 
    success: true, 
    cart: { items: [] }, 
    total: 0 
  });
});
