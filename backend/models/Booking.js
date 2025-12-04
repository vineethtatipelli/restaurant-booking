const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  numberOfGuests: { type: Number, required: true },

  bookingDateISO: { type: String, required: true },
  bookingDateHuman: { type: String, required: true },

  bookingTime: { type: String, required: true },

  cuisinePreference: { type: String },
  specialRequests: { type: String },
  locationCity: { type: String },

  seatingPreference: {
    type: String,
    enum: ["indoor", "outdoor"],
    default: "indoor",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
