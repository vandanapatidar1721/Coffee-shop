const Favorite = require('../models/Favorite');

async function getOrCreateFavorites(userId) {
    let fav = await Favorite.findOne({ userId });
    if (!fav) {
        fav = await Favorite.create({ userId, items: [] });
    }
    return fav;
}

function favToJSON(fav) {
    return { items: fav.items };
}

module.exports = { getOrCreateFavorites, favToJSON };
