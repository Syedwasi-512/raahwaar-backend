const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const COOKIE_OPTIONS = require("../config/cookieConfig");

/**
 * @desc    Professional Cart Middleware
 * @logic   Validates cartId and cleans up invalid/dead cookies to prevent server crashes.
 */
const getOrCreateCart = asyncHandler(async (req, res, next) => {
    const cartId = req.cookies?.cartId;

    // 1. If no cookie, reset state and move on
    if (!cartId) {
        req.cart = null;
        return next();
    }

    // 2. SECURITY CHECK: Validate ObjectId format
    if (!mongoose.isValidObjectId(cartId)) {
        // Professional Cleanup: Delete invalid formatted cookie
        res.clearCookie("cartId", COOKIE_OPTIONS);
        req.cart = null;
        return next();
    }

    // 3. DATABASE CHECK
    const cart = await Cart.findById(cartId);

    if (!cart) {
        // Logic: ID was valid but cart was deleted or expired in DB
        // We MUST clear this from user's browser to stop 404/500 errors on next requests
        res.clearCookie("cartId", COOKIE_OPTIONS);
        req.cart = null;
    } else {
        // Everything is fine, attach the Mongoose object
        req.cart = cart;
    }

    next();
});

module.exports = getOrCreateCart;