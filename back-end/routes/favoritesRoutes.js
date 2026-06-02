const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
    getFavorites,
    addToFavorites,
    removeFromFavorites
} = require('../controllers/favoritesController');

router.use(requireAuth);

router.get('/', getFavorites);
router.post('/add', addToFavorites);
router.post('/remove', removeFromFavorites);

module.exports = router;
