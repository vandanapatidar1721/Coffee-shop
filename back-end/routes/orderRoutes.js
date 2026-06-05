const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getOrders, placeOrder } = require('../controllers/orderController');

router.use(requireAuth);

router.get('/', getOrders);
router.post('/place', placeOrder);

module.exports = router;
