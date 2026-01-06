const mongoose = require("mongoose");
require("dotenv").config();

const Brand = require("./models/Product_Models/Brand");
const Gender = require("./models/Product_Models/Gender");
const Condition = require("./models/Product_Models/Condition");
const ShoeType = require("./models/Product_Models/ShoeType");
const Size = require("./models/Product_Models/Size");
const Color = require("./models/Product_Models/Color");

const MONGO_URI = process.env.MONGO_URI;

const brands = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "New Balance",
  "Asics",
  "Converse",
  "Warrior",
  "Under Armour",
  "Skechers",
];

const genders = ["Men", "Women", "Kids", "Unisex"];

const conditions = ["Premium", "Excellent", "Very Good", "Good"];

const shoeTypes = [
  "Running",
  "Office",
  "Sports",
  "Casual",
  "Trekking",
  "Jogging",
];

const sizes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];

const colors = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Navy", hex: "#000080" },
];
const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    await Brand.deleteMany();
    await Gender.deleteMany();
    await Condition.deleteMany();
    await ShoeType.deleteMany();
    await Size.deleteMany();
    await Color.deleteMany();

    console.log("🗑️  Existing data cleared");

    await Brand.insertMany(brands.map((name) => ({ name })));
    await Gender.insertMany(genders.map((name) => ({ name })));
    await Condition.insertMany(conditions.map((name) => ({ name })));
    await ShoeType.insertMany(shoeTypes.map((name) => ({ name })));
    await Size.insertMany(sizes.map((value) => ({ value })));
    await Color.insertMany(colors);

    console.log("🌱 Database Seeded Successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
