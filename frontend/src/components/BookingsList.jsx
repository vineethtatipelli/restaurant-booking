import React from "react";

const BACKEND_URL = "http://localhost:5000";

const BookingsList = ({ bookings, onRefresh }) => {
  const deleteBooking = async (id) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this booking?"
      );
      if (!confirmed) return;

      const res = await fetch(`${BACKEND_URL}/api/bookings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete booking");
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting booking", err);
      alert("Error deleting booking. Please try again.");
    }
  };

  return (
    <>
      <button id="refreshBtn" onClick={onRefresh}>
        Refresh Bookings
      </button>

      <ul id="bookingsList">
        {!bookings || bookings.length === 0 ? (
          <li>No bookings yet. Create one using the voice assistant.</li>
        ) : (
          bookings.map((b) => {
            const dateStr = new Date(b.bookingDate).toLocaleString();

            return (
              <li key={b._id} className="booking-item">
                <div>
                  <strong>{b.customerName}</strong> - {b.numberOfGuests} guests
                  <div className="booking-meta">
                    {dateStr} | Time: {b.bookingTime} | Seating:{" "}
                    {b.seatingPreference || "indoor"} | Cuisine:{" "}
                    {b.cuisinePreference || "Any"}
                  </div>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => deleteBooking(b._id)}
                >
                  Delete
                </button>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
};

export default BookingsList;
