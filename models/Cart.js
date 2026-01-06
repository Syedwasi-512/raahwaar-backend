const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, default: 1, min: 1 },
  price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema(
  {
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

// Fix the getTotal calculation
cartSchema.methods.getTotal = function () {
  return (this.items || []).reduce(
    (sum, it) => sum + ((it.price || 0) * (it.quantity || 0)),
    0
  );
};

module.exports = mongoose.model("Cart", cartSchema);