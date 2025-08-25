let cart = {
    items: [],
    total: 0
};

const getCart = (req, res) => {
    res.json(cart);
};

const addToCart = (req, res) => {
    const { id, name, price } = req.body;

    if (!id || !name || !price) {
        return res.status(400).json({ message: 'Product information is missing.' });
    }

    const existingItem = cart.items.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.items.push({ id, name, price, quantity: 1 });
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    console.log('Cart updated:', cart);
    res.status(200).json(cart);
};

const removeFromCart = (req, res) => {
    const { id } = req.body;

    cart.items = cart.items.filter(item => item.id !== id);

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    console.log('Item removed, cart is now:', cart);
    res.status(200).json(cart);
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart
};