const Booking = require('../models/Booking');

const log = (label, message) => {
    const time = new Date().toLocaleString('en-IN', { hour12: true });
    console.log(`[${time}] [${label}] ${message}`);
};

const bookTable = async (req, res) => {
    try {
        const { name, email, phone, date, time, guests } = req.body;

        log('BOOKING', 'Request received');

        if (!name || !email || !phone || !date || !time || !guests) {
            log('BOOKING', 'Failed — missing fields');
            return res.status(400).json({ message: 'All booking fields are required.' });
        }

        const emailLower = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            log('BOOKING', 'Failed — invalid email');
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        const booking = await Booking.create({
            userId: req.userId,
            name: name.trim(),
            email: emailLower,
            phone: phone.trim(),
            date,
            time,
            guests: String(guests),
            discountPercent: 30,
            status: 'confirmed'
        });

        log('BOOKING', `Success — booking ${booking._id.toString()}`);

        res.status(201).json({
            message: `Table booked for ${emailLower}! Your 30% online reservation discount will be applied on your visit.`,
            booking: {
                id: booking._id.toString(),
                date: booking.date,
                time: booking.time,
                guests: booking.guests,
                discountPercent: booking.discountPercent
            }
        });
    } catch (err) {
        console.error('[BOOKING] Error:', err.message);
        res.status(500).json({ message: err.message || 'Booking failed.' });
    }
};

const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { bookTable, getBookings };
