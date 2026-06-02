const express = require('express');
const router = express.Router();
const { handleSubscribe } = require('../controllers/newsletterController');

router.post('/', handleSubscribe);

module.exports = router;
