const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product_Models/Product");
const ProductImage = require("../models/Product_Models/ProductImage");
const sendEmail = require("../utils/mailer");

// --- HELPER: Professional Shopify-Grade Email Template ---
const getEmailTemplate = (type, data) => {
  const { name, items, totalAmount, url, orderId } = data;

  // Generate Table Rows for Items with High Visibility
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #eeeeee; vertical-align: top;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="90" style="vertical-align: top;">
              <img src="${
                item.imageUrl || "https://via.placeholder.com/100"
              }" alt="${
        item.title
      }" width="80" height="80" style="border-radius: 8px; border: 1px solid #e5e5e5; object-fit: cover; display: block;">
            </td>
            <td style="padding-left: 15px; vertical-align: top;">
              <h4 style="margin: 0; font-size: 16px; color: #1a1a1a; font-weight: 700; line-height: 1.4;">${
                item.title
              }</h4>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">Size: <span style="color: #000; font-weight: 600;">${
                item.sizeId?.value || "N/A"
              }</span></p>
              <p style="margin: 0; font-size: 14px; color: #666666;">Quantity: <span style="color: #000; font-weight: 600;">${
                item.orderQty
              }</span></p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <p style="margin: 0; font-size: 16px; font-weight: 800; color: #1a1a1a;">Rs. ${item.finalPrice.toLocaleString()}</p>
              ${
                item.discountPercent > 0
                  ? `<p style="margin: 4px 0 0; font-size: 12px; color: #ff4d4d; text-decoration: line-through;">Rs. ${item.price.toLocaleString()}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join("");

  const emailStyles = `
    background-color: #f4f4f4;
    padding: 40px 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  if (type === "CONFIRM_REQUEST") {
    return `
      <div style="${emailStyles}">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 26px; letter-spacing: 5px; font-weight: 900; color: #000;">RAAHWAAR</h1>
              <p style="margin: 5px 0 0; font-size: 11px; letter-spacing: 2px; color: #888; text-transform: uppercase;">Premium Footwear Store</p>
            </div>
            
            <h2 style="font-size: 22px; font-weight: 800; color: #1a1a1a; margin-bottom: 15px; text-align: center; line-height: 1.3;">Action Required: Verify Your Order</h2>
            <p style="font-size: 16px; color: #444; line-height: 1.6; text-align: center; margin-bottom: 30px;">Hello <strong>${name}</strong>,<br>Your order has been received! Please click the button below to verify your purchase and finalize your shipment.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${url}" style="background-color: #000000; color: #ffffff; padding: 20px 45px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 900; display: inline-block; letter-spacing: 1.5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">VERIFY & CONFIRM ORDER</a>
            </div>

            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 50px; border-top: 3px solid #f0f0f0;">
              <thead>
                <tr>
                  <th align="left" style="padding: 20px 0 10px; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Product Manifest</th>
                  <th align="right" style="padding: 20px 0 10px; font-size: 13px; color: #999; text-transform: uppercase; letter-spacing: 1px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>

            <table width="100%" style="margin-top: 25px; background: #fafafa; border-radius: 12px; padding: 20px;">

             <!-- Shipping Row -->
<tr>
  <td style="padding: 5px 0; font-size: 14px; color: #666;">Shipping Fee</td>
  <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: 700; color: #1a1a1a;">
    As per Courier Rates
  </td>
</tr>

<!-- Total Row -->
<tr>
  <td style="padding: 15px 0 0; font-size: 18px; font-weight: 800; color: #000; border-top: 1px solid #eeeeee;">
    Total Amount
  </td>
  <td align="right" style="padding: 15px 0 0; font-size: 22px; font-weight: 900; color: #000; border-top: 1px solid #eeeeee;">
    Rs. ${totalAmount.toLocaleString()}*
  </td>
</tr>

<!-- Professional Note -->
<tr>
  <td colspan="2" style="padding-top: 10px; font-size: 11px; color: #999; font-style: italic; text-align: right;">
    *Shipping charges will be calculated based on your location and weight by the courier service at the time of delivery.
  </td>
</tr>

              <tr>
                <td style="padding: 15px 0 0; font-size: 19px; font-weight: 800; color: #000; border-top: 1px solid #eee;">Total Amount</td>
                <td align="right" style="padding: 15px 0 0; font-size: 24px; font-weight: 900; color: #000; border-top: 1px solid #eee;">Rs. ${totalAmount.toLocaleString()}</td>
              </tr>
            </table>

            <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 30px;">
               <p style="margin: 0; font-size: 14px; color: #888; font-weight: 600;">Delivery: <span style="color: #000;">3-5 Working Days</span></p>
               <p style="margin: 10px 0 0; font-size: 11px; color: #bbb;">Link expires in 24 hours. For help, contact support@raahwaar.pk</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (type === "ORDER_SUCCESS") {
    return `
      <div style="${emailStyles}">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 50px 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 26px; letter-spacing: 5px; font-weight: 900; color: #000;">RAAHWAAR</h1>
          </div>
          <div style="margin: 20px 0; color: #28a745; font-size: 50px;">✔</div>
          <h2 style="font-size: 24px; font-weight: 900; color: #1a1a1a; margin: 0;">THANK YOU FOR VERIFYING!</h2>
          <p style="font-size: 16px; color: #555; margin-top: 15px; line-height: 1.6;">Order <strong>#${orderId
            .toString()
            .slice(-6)
            .toUpperCase()}</strong> has been successfully confirmed. We are now preparing your items for dispatch.</p>
          <div style="margin-top: 35px; padding: 25px; background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0;">
            <p style="margin: 0; font-size: 13px; color: #888; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Amount Payable (COD)</p>
            <p style="margin: 8px 0 0; font-size: 28px; font-weight: 900; color: #000;">Rs. ${totalAmount.toLocaleString()}</p>
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #999;">Visit <a href="${
            process.env.FRONTEND_URL
          }" style="color: #000; font-weight: 700;">raahwaar.pk</a> for more premium footwear.</p>
        </div>
      </div>
    `;
  }
};

// --- CONTROLLERS ---

exports.createOrder = asyncHandler(async (req, res) => {
  const { name, email, phone, shippingAddress, products } = req.body;

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error("Bag is empty");
  }

  const productIds = products.map((p) => p.productId);
  const dbProducts = await Product.find({ _id: { $in: productIds } })
    .populate("sizeId")
    .lean();

  // Logic Fix: Fetch images too so we can pass them to email template
  const dbImages = await ProductImage.find({
    productId: { $in: productIds },
  }).lean();

  let totalAmount = 0;
  const emailItems = [];

  for (const item of products) {
    const dbItem = dbProducts.find(
      (p) => p._id.toString() === item.productId.toString()
    );
    if (!dbItem) throw new Error("Product data mismatch");
    if (dbItem.quantity < item.quantity)
      throw new Error(`Stock unavailable: ${dbItem.title}`);

    const baseprice = dbItem.price || 0;
    const discount = dbItem.discountPercent || 0;
    const discountedPrice = Math.round(
      discount > 0 ? baseprice - (baseprice * discount) / 100 : baseprice
    );

    totalAmount += discountedPrice * item.quantity;

    // Find first image for this product
    const primaryImage = dbImages.find(
      (img) => img.productId.toString() === dbItem._id.toString()
    );

    emailItems.push({
      ...dbItem,
      orderQty: item.quantity,
      finalPrice: discountedPrice,
      imageUrl: primaryImage?.url,
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const order = await Order.create({
    name,
    email,
    phone,
    shippingAddress,
    products,
    totalAmount,
    confirmationToken: token,
    confirmationTokenExpires: expiry,
    status: "Pending",
  });

  const confirmUrl = `${process.env.BACKEND_URL}/api/orders/confirm/${order._id}/${token}`;

  // Pass enhanced data to template
  const htmlContent = getEmailTemplate("CONFIRM_REQUEST", {
    name,
    items: emailItems,
    totalAmount,
    url: confirmUrl,
  });

  await sendEmail(email, "Verify Your Order - Raahwaar Store", htmlContent);

  res.status(201).json({
    success: true,
    message: "Confirmation email sent successfully.",
  });
});

// ... Baki controllers (confirmOrder, getOrders) same rahein ge as previously refactored for performance.

// @desc    Step 2: Confirm Order & Deduct Inventory (Safe Transaction)
// @route   GET /api/orders/confirm/:id/:token
// @desc    Confirm order & Deduct Stock
// @route   GET /api/orders/confirm/:id/:token
exports.confirmOrder = asyncHandler(async (req, res) => {
  const { id, token } = req.params;

  // 1. Fetch Order (No .lean() here because we need to save later)
  const order = await Order.findOne({ _id: id, confirmationToken: token });

  // 2. Validate Order & Token
  if (!order) {
    res.status(400);
    throw new Error("Invalid or expired confirmation link");
  }

  if (order.isConfirmed) {
    res.status(400);
    throw new Error("This order has already been confirmed");
  }

  // 3. ATOMIC Stock Deduction (Industry Standard)
  // .map() tabhi chalega agar products array mojood ho
  const items = order.products || [];
  if (items.length === 0) {
    res.status(400);
    throw new Error("Order manifest is empty. Confirmation failed.");
  }

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.productId, quantity: { $gte: item.quantity } },
      update: { $inc: { quantity: -item.quantity } },
    },
  }));

  const result = await Product.bulkWrite(bulkOps);

  // 4. Verify if all items were in stock
  if (result.modifiedCount !== items.length) {
    res.status(400);
    throw new Error("Stock shortage: One or more items are now unavailable");
  }

  // 5. Update Order Status
  order.isConfirmed = true;
  order.confirmationToken = undefined;
  order.status = "Confirmed";
  await order.save();

  // 6. Send Success Email (Async)
  const successHtml = getEmailTemplate("ORDER_SUCCESS", {
    name: order.name,
    orderId: order._id,
    items: [],
    totalAmount: order.totalAmount,
  });
  sendEmail(order.email, "✅ Order Confirmed - Raahwaar", successHtml);

  // 7. Success UI Response
  res.send(`
    <div style="font-family:sans-serif; text-align:center; padding:50px; background:#f9f9f9; min-height:100vh;">
      <div style="background:white; max-width:500px; margin:auto; padding:40px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color:#28a745; margin-bottom:10px;">✔ Confirmed!</h1>
        <p style="color:#666;">Thank you <b>${order.name}</b>, your order is verified and is being processed.</p>
        <p style="font-size:12px; color:#999; margin-top:20px;">You can close this window now.</p>
      </div>
    </div>
  `);
});

// @desc    Get All Orders (Admin Only)
// @route   GET /api/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate({
      path: "products.productId",
      select: "title brandId sizeId price finalPrice",
      populate: { path: "brandId sizeId", select: "name value" },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: orders.length, orders });
});
