const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
    value: {type: String , required: true,}
});

module.exports = mongoose.model("Size", sizeSchema);