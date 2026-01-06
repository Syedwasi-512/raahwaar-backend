const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler"); // For clean error flow
const Blacklist = require("../models/Blacklist");
const Admin = require("../models/Admin"); // Admin model ko import karein

const adminAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

     // --- SECURITY CHECK: Blacklist verification ---
    const isBlacklisted = await Blacklist.findOne({ token }).lean();
    if (isBlacklisted) {
        res.status(401);
        throw new Error("Session expired. Please login again.");
    }

  try {
    // 3. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. SECURITY HARDENING: Verify if Admin still exists in Database
    const currentAdmin = await Admin.findById(decoded.id)
      .select("-password")
      .lean();

    if (!currentAdmin) {
      res.status(401);
      throw new Error(
        "Security Alert: Admin account no longer exists or is deactivated."
      );
    }

    // 5. Attach Admin data to Request
    req.admin = currentAdmin;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401);
    throw new Error("Authentication failed: Invalid or expired token");
  }
});

module.exports = adminAuth;
