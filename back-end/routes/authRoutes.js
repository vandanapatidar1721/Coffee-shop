const express = require('express');
const router = express.Router();
const validateSignup = require('../middleware/validateSignup');
const { handleSignup, handleLogin } = require('../controllers/authController');

router.post('/signup', validateSignup, handleSignup);
router.post('/login', handleLogin);

module.exports = router;
