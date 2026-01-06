const express = require('express');
const router = express.Router();
const getOrCreateCart = require('../middlewares/getOrCreateCart')
const controller = require('../controllers/cartController');

router.use(getOrCreateCart);

router.get('/', controller.getCart);
router.post('/add', controller.addToCart);
router.put('/update', controller.updateItem);
router.post('/clear', controller.clearCart);
router.post('/remove', controller.removeItem);

module.exports = router;

