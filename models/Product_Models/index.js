// models/index.js
const mongoose = require("mongoose");

module.exports = {
  Product: require("./Product"),
  ProductImage: require("./ProductImage"),
  Gender: require("./Gender"),
  Brand: require("./Brand"),
  Condition: require("./Condition"),
  ShoeType: require("./ShoeType"),
  Size: require("./Size"),
  Color: require("./Color")
};
