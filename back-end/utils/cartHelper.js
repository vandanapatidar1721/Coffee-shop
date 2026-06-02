const Cart = require('../models/Cart');

async function getOrCreateCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, items: [], total: 0 });
    }
    return cart;
}

function recalcTotal(cart) {
    cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    return cart;
}

function cartToJSON(cart) {
    return {
        items: cart.items,
        total: cart.total
    };
}

module.exports = { getOrCreateCart, recalcTotal, cartToJSON };
