const Booking = require("../models/Booking");

const createBooking = async (req, res) => {
  try {
    const {
      customerName,
      numberOfGuests,
      bookingDateISO,
      bookingDateHuman,
      bookingTime,
      cuisinePreference,
      specialRequests,
      locationCity,
    } = req.body;

    const newBooking = await Booking.create({
      customerName,
      numberOfGuests,
      bookingDateISO,
      bookingDateHuman,
      bookingTime,
      cuisinePreference,
      specialRequests,
      locationCity,
      seatingPreference: "indoor",
    });

    return res.json({ success: true, booking: newBooking });
  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ success: false });
  }
};

const getBookings = async (req, res) =>
  res.json(await Booking.find().sort({ createdAt: -1 }));

const getBookingById = async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) return res.status(404).json({ message: "Not found" });
  res.json(b);
};

const deleteBooking = async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

module.exports = { createBooking, getBookings, getBookingById, deleteBooking };
