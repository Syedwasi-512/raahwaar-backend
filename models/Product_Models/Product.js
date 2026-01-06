const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    
    description: { type: String, required: true },

    price: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          return v > 0;
        },
        message: (props) => `${props.value} is not a valid price!`,
      },
    },

    genderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gender",
      required: true,
    },

    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShoeType",
      required: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    conditionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Condition",
      required: true,
    },

    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Size",
      required: true,
    },

    colorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 1,
    },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    discountPercent: {
      type: Number,
      min: [0, "Cannot less than 0"],
      max: [100, "Cannot exceed 100"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.pre("save", function (next) {
  this.inStock = this.quantity > 0;
  next();
});

// Virtual for displaying discounted price
productSchema.virtual("finalPrice").get(function () {
  if (this.discountPercent) {
    return this.price - (this.price * this.discountPercent) / 100;
  }
  return this.price;
});

productSchema.index({ title: "text", description: "text" });
productSchema.index({ brandId: 1, typeId: 1, genderId: 1 });
productSchema.index({ finalPrice: 1, price: 1 });

// 4. Sorting Index (New Arrivals dikhane ke liye)
productSchema.index({ createdAt: -1 });
productSchema.index({ quantity: 1 });
module.exports = mongoose.model("Product", productSchema);
