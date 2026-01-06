const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
});

module.exports = mongoose.model("ProductImage", productImageSchema);