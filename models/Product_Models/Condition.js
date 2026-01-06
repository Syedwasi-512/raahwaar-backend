const mongoose = require("mongoose");

const conditionSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
});

module.exports = mongoose.model("Condition", conditionSchema);