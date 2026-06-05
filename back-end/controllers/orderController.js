const Order = require('../models/Order');
const { getOrCreateCart, recalcTotal, cartToJSON } = require('../utils/cartHelper');

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            orders: orders.map((order) => ({
                id: order._id.toString(),
                items: order.items,
                total: order.total,
                createdAt: order.createdAt
            }))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const placeOrder = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.userId);

        if (!cart.items.length) {
            return res.status(400).json({ message: 'Your cart is empty.' });
        }

        recalcTotal(cart);

        const order = await Order.create({
            userId: req.userId,
            items: cart.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity
            })),
            total: cart.total
        });

        cart.items = [];
        cart.total = 0;
        await cart.save();

        res.status(201).json({
            message: 'Order placed successfully!',
            order: {
                id: order._id.toString(),
                items: order.items,
                total: order.total,
                createdAt: order.createdAt
            },
            cart: cartToJSON(cart)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getOrders, placeOrder };
