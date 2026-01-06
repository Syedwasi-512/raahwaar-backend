const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h', // Yeh token 24 ghante baad khud delete ho jayega
  },
});

module.exports = mongoose.model("Blacklist", blacklistSchema);