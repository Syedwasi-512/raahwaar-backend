const express = require("express");
const router = express.Router();
const { getFiltersData } = require("../controllers/filter.Controller");

// Use standard GET for fetching data
router.get("/", getFiltersData);

module.exports = router;