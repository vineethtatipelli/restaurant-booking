import React, { useCallback, useEffect, useState } from "react";
import VoiceAssistant from "./components/VoiceAssistant";
import BookingsList from "./components/BookingsList";

const BACKEND_URL = "http://localhost:5000";

const App = () => {
  const [bookings, setBookings] = useState([]);

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/bookings`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings", err);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <div className="container">
      <h1>Restaurant Booking Voice Agent</h1>
      <p>
        Click the button and speak with the assistant to book a table. Make sure
        to allow microphone access.
      </p>

      {/* Voice Assistant */}
      <VoiceAssistant onBookingComplete={loadBookings} />

      <hr />

      {/* Existing Bookings */}
      <section>
        <h2>Existing Bookings</h2>
        <BookingsList bookings={bookings} onRefresh={loadBookings} />
      </section>
    </div>
  );
};

export default App;
