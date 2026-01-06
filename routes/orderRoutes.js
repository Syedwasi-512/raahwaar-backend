const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');

const { createOrder , getOrders , confirmOrder} = require('../controllers/orderController');

router.post('/' , createOrder);
router.get('/' , adminAuth , getOrders);  //(for admin)
router.get('/confirm/:id/:token' , confirmOrder);

module.exports = router;