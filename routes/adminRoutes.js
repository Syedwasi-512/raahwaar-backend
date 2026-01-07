const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const Blacklist = require("../models/Blacklist");
const adminAuth = require("../middlewares/adminAuth");
const asyncHandler = require("express-async-handler");

/*  router.post('/signup' , async(req , res)=>{
try {
    const {email , password} = req.body;
    const adminExists = await Admin.findOne({email});
    if(adminExists) return res.status(400).json({message: "Admin already exists"});
    const admin = await Admin.create({email , password});
    res.status(201).json({ message: 'Admin created successfully' });

} catch (error) {
    res.status(500).json({message: error.message});
}
});  */

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = req.body.password || "";
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Sirf HTTPS par chalega
      sameSite: "none", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 din ki expiry
    });

    res.status(200).json({ token, message: "Login successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// routes/adminRoutes.js
router.get("/verify", adminAuth, (req, res) => {
  // Agar adminAuth middleware ne pass kar diya, toh matlab user authorized hai
  res.status(200).json({ success: true, admin: req.admin });
});

//password change
router.put("/change-password", adminAuth, async (req, res) => {
  try {
    const { currentPassword = "", newPassword = "" } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const ok = await admin.comparePassword(currentPassword);
    if (!ok) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    admin.password = newPassword;
    await admin.save();

    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get(
  "/logout",
  adminAuth,
  asyncHandler(async (req, res) => {
    const token = req.cookies.adminToken;

    if (token) {
      // 2. Token ko blacklist mein dalain taake yeh dobara use na ho sakay
      await Blacklist.create({ token });
    }
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // Yeh lazmi hai, warna cookie remove nahi hogi
    });

    res
      .status(200)
      .json({ message: "Logged out successfully. Token is now invalidated." });
  })
);

module.exports = router;
