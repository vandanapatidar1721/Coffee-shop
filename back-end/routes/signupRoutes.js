const express = require('express');
const router = express.Router();
const { handleSignup } = require('../controller/signupController');

// POST /signup
router.post('/', handleSignup);

module.exports = router;