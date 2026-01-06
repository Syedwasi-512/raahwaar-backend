const express = require("express");
const router = express.Router();
const { getAllProduct, createProduct, deleteProduct, updateProduct } = require('../controllers/productController');
const upload = require("../middlewares/upload");
const adminAuth = require("../middlewares/adminAuth");

// Professional routing style
router.route('/')
    .get(getAllProduct)
    .post(adminAuth, upload.array('images', 8), createProduct);

router.route('/:id')
    .delete(adminAuth, deleteProduct)
    .put(adminAuth, upload.array('images', 8), updateProduct);

module.exports = router;