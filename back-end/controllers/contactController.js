const Contact = require('../models/Contact');

const handleContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const entry = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim()
        });

        res.status(201).json({
            message: 'Message sent successfully!',
            data: entry
        });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Could not save message.' });
    }
};

module.exports = { handleContact };
