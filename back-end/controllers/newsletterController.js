const Newsletter = require('../models/Newsletter');

const handleSubscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const emailLower = email.trim().toLowerCase();
        const exists = await Newsletter.findOne({ email: emailLower });
        if (exists) {
            return res.status(409).json({ message: 'This email is already subscribed.' });
        }

        await Newsletter.create({ email: emailLower });
        res.status(201).json({ message: 'Subscribed successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Subscription failed.' });
    }
};

module.exports = { handleSubscribe };
