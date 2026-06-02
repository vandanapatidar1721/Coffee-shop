const Booking = require('../models/Booking');

const log = (label, message, data = {}) => {
    const time = new Date().toLocaleString('en-IN', { hour12: true });
    console.log(`[${time}] [${label}] ${message}`, Object.keys(data).length ? data : '');
};

const bookTable = async (req, res) => {
    try {
        const { name, email, phone, date, time, guests } = req.body;

        log('BOOKING', 'Request received', { name, email, phone, date, time, guests });

        if (!name || !email || !phone || !date || !time || !guests) {
            log('BOOKING', 'Failed — missing fields');
            return res.status(400).json({ message: 'All booking fields are required.' });
        }

        const emailLower = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
            log('BOOKING', 'Failed — invalid email', { email });
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        const booking = await Booking.create({
            name: name.trim(),
            email: emailLower,
            phone: phone.trim(),
            date,
            time,
            guests: String(guests),
            status: 'confirmed'
        });

        log('BOOKING', 'Success — table booked', {
            bookingId: booking._id.toString(),
            name: booking.name,
            email: booking.email,
            date: booking.date,
            time: booking.time,
            guests: booking.guests
        });

        res.status(201).json({
            message: `Table booked successfully for ${emailLower}!`,
            booking
        });
    } catch (err) {
        console.error('[BOOKING] Error:', err.message);
        res.status(500).json({ message: err.message || 'Booking failed.' });
    }
};

const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { bookTable, getBookings };
