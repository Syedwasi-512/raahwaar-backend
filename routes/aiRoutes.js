const express = require('express');
const router = express.Router();
const { personalShopper } = require('../controllers/aiController');


router.post("/chat", personalShopper);

module.exports = router;