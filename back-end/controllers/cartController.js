const { getOrCreateCart, recalcTotal, cartToJSON } = require('../utils/cartHelper');

const getCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.userId);
        res.json(cartToJSON(cart));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const { id, name, price, image } = req.body;
        const numericPrice = parseFloat(price);

        if (!id || !name || Number.isNaN(numericPrice)) {
            return res.status(400).json({ message: 'Product information is missing.' });
        }

        const cart = await getOrCreateCart(req.userId);
        const existingItem = cart.items.find((item) => String(item.id) === String(id));

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                id: String(id),
                name,
                price: numericPrice,
                image: image || '',
                quantity: 1
            });
        }

        recalcTotal(cart);
        await cart.save();
        res.status(200).json(cartToJSON(cart));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { id } = req.body;
        const cart = await getOrCreateCart(req.userId);
        cart.items = cart.items.filter((item) => String(item.id) !== String(id));
        recalcTotal(cart);
        await cart.save();
        res.status(200).json(cartToJSON(cart));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const clearCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.userId);
        cart.items = [];
        cart.total = 0;
        await cart.save();
        res.status(200).json({ message: 'Order placed!', cart: cartToJSON(cart) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
