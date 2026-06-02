const { getOrCreateFavorites, favToJSON } = require('../utils/favHelper');

const getFavorites = async (req, res) => {
    try {
        const fav = await getOrCreateFavorites(req.userId);
        res.json(favToJSON(fav));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addToFavorites = async (req, res) => {
    try {
        const { id, name, price, image } = req.body;

        if (!id || !name) {
            return res.status(400).json({ message: 'Product information is missing.' });
        }

        const fav = await getOrCreateFavorites(req.userId);
        const exists = fav.items.find((item) => String(item.id) === String(id));

        if (!exists) {
            fav.items.push({
                id: String(id),
                name,
                price: price || '',
                image: image || ''
            });
            await fav.save();
        }

        res.status(200).json(favToJSON(fav));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const removeFromFavorites = async (req, res) => {
    try {
        const { id } = req.body;
        const fav = await getOrCreateFavorites(req.userId);
        fav.items = fav.items.filter((item) => String(item.id) !== String(id));
        await fav.save();
        res.status(200).json(favToJSON(fav));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getFavorites, addToFavorites, removeFromFavorites };
