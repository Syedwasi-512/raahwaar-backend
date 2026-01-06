const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Attaches existing cart to request or cleans up dead cookies
 * @logic   Does not create a cart until an item is actually added (Performance focus)
 */
const getOrCreateCart = asyncHandler(async (req, res, next) => {
    const cartId = req.cookies?.cartId;

    // 1. Agar cookie hi nahi hai, toh seedha agle middleware par jao
    if (!cartId) {
        req.cart = null;
        return next();
    }

    // 2. Security Check: Validate ID format before DB call
    if (!mongoose.isValidObjectId(cartId)) {
        // Professional Touch: Agar ID invalid hai, toh browser se cookie uda do
        res.clearCookie("cartId");
        req.cart = null;
        return next();
    }

    // 3. Find Cart (Lean use nahi karenge kyunke controllers isay save() karenge)
    const cart = await Cart.findById(cartId);

    if (!cart) {
        // Logic: Agar Cookie mein ID thi par DB mein cart nahi mila (Expired or Deleted)
        // Toh browser ko bolo ke ye cookie ab purani ho chuki hai
        res.clearCookie("cartId");
        req.cart = null;
    } else {
        // Attach the real Mongoose document
        req.cart = cart;
    }

    next();
});

module.exports = getOrCreateCart;