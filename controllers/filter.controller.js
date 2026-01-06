const asyncHandler = require("express-async-handler");
const db = require("../models/Product_Models/index");

const { Brand, Gender, Size, Condition, ShoeType, Color } = db;

// In-memory cache variable
let filtersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 1000 * 60 * 30; // 30 Minutes cache

// @desc    Get all filter options (Optimized with Caching)
// @route   GET /api/filters
exports.getFiltersData = asyncHandler(async (req, res) => {
  const currentTime = Date.now();

  // 1. Check if cache exists and is not expired
  if (filtersCache && lastFetchTime && (currentTime - lastFetchTime < CACHE_DURATION)) {
    return res.status(200).json({
      success: true,
      source: "cache",
      data: filtersCache,
    });
  }

  // 2. If no cache, fetch from DB in parallel
  // Use .lean() for maximum performance
  const [genders, shoeTypes, brands, conditions, sizes, colors] =
    await Promise.all([
      Gender.find().select("name").lean(),
      ShoeType.find().select("name").lean(),
      Brand.find().select("name").lean(),
      Condition.find().select("name").lean(),
      Size.find().select("value").lean(),
      Color.find().select("name hex").lean(),
    ]);

  const freshFilters = {
    genders,
    shoeTypes,
    brands,
    conditions,
    sizes,
    colors,
  };

  // 3. Update Cache
  filtersCache = freshFilters;
  lastFetchTime = currentTime;

  res.status(200).json({
    success: true,
    source: "database",
    data: freshFilters,
  });
});

// @desc    Clear filter cache (Call this when Admin adds a new Brand/Size)
// Hum isay exports mein rakh dete hain taake agar aap koi naya brand add karein toh cache clear ho sakay
exports.clearFilterCache = () => {
  filtersCache = null;
  lastFetchTime = null;
};