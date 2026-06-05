const { getOrCreateFavorites, favToJSON } = require('../utils/favHelper');
const { resolveProduct } = require('../utils/productHelper');

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
        const resolved = resolveProduct({ id, name, price });

        if (!resolved.valid) {
            return res.status(400).json({ message: resolved.message });
        }

        const product = resolved.product;
        const fav = await getOrCreateFavorites(req.userId);
        const exists = fav.items.find((item) => String(item.id) === String(product.id));

        if (!exists) {
            fav.items.push({
                id: product.id,
                name: product.name,
                price: String(product.price),
                image: image || product.image
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

        if (!id) {
            return res.status(400).json({ message: 'Product id is required.' });
        }

        const fav = await getOrCreateFavorites(req.userId);
        fav.items = fav.items.filter((item) => String(item.id) !== String(id));
        await fav.save();
        res.status(200).json(favToJSON(fav));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getFavorites, addToFavorites, removeFromFavorites };
