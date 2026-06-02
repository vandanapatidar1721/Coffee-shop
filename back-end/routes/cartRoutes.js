const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');

router.use(requireAuth);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.post('/checkout', clearCart);

module.exports = router;
