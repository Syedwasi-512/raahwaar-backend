const mongoose = require("mongoose");

const typeScheme = new mongoose.Schema({
    name: {type: String, required: true, unique:true}
});

module.exports = mongoose.model("ShoeType", typeScheme);