const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  deleteBooking,
} = require("../controllers/bookingsController");

router.post("/", createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingById);
router.delete("/:id", deleteBooking);

module.exports = router;
