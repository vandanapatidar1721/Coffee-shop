const { getOrCreateCart, recalcTotal, cartToJSON } = require('../utils/cartHelper');
const { resolveProduct } = require('../utils/productHelper');
const { placeOrder } = require('./orderController');

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
        const resolved = resolveProduct({ id, name, price });

        if (!resolved.valid) {
            return res.status(400).json({ message: resolved.message });
        }

        const product = resolved.product;
        const cart = await getOrCreateCart(req.userId);
        const existingItem = cart.items.find((item) => String(item.id) === String(product.id));

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: image || product.image,
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

const updateCartQuantity = async (req, res) => {
    try {
        const { id, quantity } = req.body;
        const qty = parseInt(quantity, 10);

        if (!id || Number.isNaN(qty) || qty < 1) {
            return res.status(400).json({ message: 'Valid item id and quantity are required.' });
        }

        const cart = await getOrCreateCart(req.userId);
        const item = cart.items.find((entry) => String(entry.id) === String(id));

        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }

        item.quantity = qty;
        recalcTotal(cart);
        await cart.save();
        res.status(200).json(cartToJSON(cart));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getCart, addToCart, removeFromCart, updateCartQuantity, checkout: placeOrder };
