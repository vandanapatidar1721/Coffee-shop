const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    checkout
} = require('../controllers/cartController');

router.use(requireAuth);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.post('/update-quantity', updateCartQuantity);
router.post('/checkout', checkout);

module.exports = router;
