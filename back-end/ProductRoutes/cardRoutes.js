const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    removeFromCart
} = require('..//ProductController/cardController.js');

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);

module.exports = router;