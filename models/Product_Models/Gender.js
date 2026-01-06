const mongoose = require("mongoose");

const genderSchema = new mongoose.Schema({
    name: { type: String, required:true,  unique: true}
});

module.exports = mongoose.model("Gender", genderSchema);