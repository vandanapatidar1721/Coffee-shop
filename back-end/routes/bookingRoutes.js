const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { bookTable, getBookings } = require('../controllers/bookingController');

router.post('/', requireAuth, bookTable);
router.get('/', getBookings);

module.exports = router;
