import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL = "http://localhost:5000";

const VoiceAssistant = ({ onBookingComplete }) => {
  const [statusText, setStatusText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [userSpeech, setUserSpeech] = useState("");
  const [bookingData, setBookingData] = useState({}); // just for UI display

  const stateRef = useRef("idle");
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // 🔑 Single source of truth for conversation data
  const bookingRef = useRef({});

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // -------------------------
  // INIT SPEECH RECOGNITION
  // -------------------------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      isListeningRef.current = true;
      setStatusText("🎤 Listening...");
    };

    recog.onresult = (event) => {
      const result = event.results[0];
      if (!result.isFinal) return;

      const transcript = result[0].transcript.trim();
      console.log("User:", transcript);

      isListeningRef.current = false;
      setStatusText("");

      setUserSpeech(transcript);
      handleUserInput(transcript.toLowerCase());
    };

    recog.onerror = (err) => {
      console.log("STT error:", err);
      isListeningRef.current = false;
      setStatusText("Microphone error");
    };

    recog.onend = () => {
      console.log("STT ended");
      isListeningRef.current = false;
      setStatusText("");
    };

    recognitionRef.current = recog;
  }, []);

  // -------------------------
  // HELPERS
  // -------------------------
  const capitalize = (s) =>
    s
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.substring(1) : ""))
      .join(" ")
      .trim();

  const extractNumber = (text) => {
    const m = text.match(/\d+/);
    if (m) return Number(m[0]);
    if (text.includes("two")) return 2;
    if (text.includes("three")) return 3;
    if (text.includes("four")) return 4;
    if (text.includes("five")) return 5;
    return 2;
  };

  const parseDateFromSpeech = (t) => {
    const now = new Date();
    const d = new Date(now);
    if (t.includes("tomorrow")) d.setDate(now.getDate() + 1);
    else if (t.includes("day after")) d.setDate(now.getDate() + 2);
    // if user says "today" or doesn't specify, we keep today
    return d;
  };

  // -------------------------
  // SPEAK (TTS)
  // -------------------------
  const speak = async (text, onEnd) => {
    console.log("Assistant:", text);
    setAssistantText(text);

    try {
      recognitionRef.current?.stop();
    } catch {}

    isListeningRef.current = false;
    setStatusText("");

    await delay(100);

    const utter = new SpeechSynthesisUtterance(text);

    await new Promise((resolve) => {
      utter.onend = resolve;
      window.speechSynthesis.speak(utter);
    });

    if (onEnd) onEnd();
  };

  // -------------------------
  // START LISTENING
  // -------------------------
  const startListening = async () => {
    if (isListeningRef.current) return;
    try {
      recognitionRef.current?.start();
    } catch (err) {
      console.warn("STT start blocked, retrying...", err);
      await delay(200);
      try {
        recognitionRef.current?.start();
      } catch {}
    }
  };

  const speakAndListen = (text) => {
    speak(text, () => {
      startListening();
    });
  };

  // -------------------------
  // STATE MACHINE
  // -------------------------
  const handleUserInput = (text) => {
    const state = stateRef.current;

    // --- ASK NAME ---
    if (state === "ask_name") {
      const name = capitalize(text);

      bookingRef.current = {
        ...bookingRef.current,
        customerName: name,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_guests";
      speakAndListen(
        `Nice to meet you, ${name}. How many guests should I book for?`
      );
      return;
    }

    // --- ASK GUESTS ---
    if (state === "ask_guests") {
      const guests = extractNumber(text);

      bookingRef.current = {
        ...bookingRef.current,
        numberOfGuests: guests,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_date";
      speakAndListen(
        `Okay, ${guests} guests. For which day would you like the booking? You can say today, tomorrow, or day after tomorrow.`
      );
      return;
    }

    // --- ASK DATE ---
    if (state === "ask_date") {
      const dateObj = parseDateFromSpeech(text);

      bookingRef.current = {
        ...bookingRef.current,
        bookingDateISO: dateObj.toISOString(),
        bookingDateHuman: dateObj.toDateString(),
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_time";
      speakAndListen(
        `Got it. What time should I reserve for ${bookingRef.current.bookingDateHuman}?`
      );
      return;
    }

    // --- ASK TIME ---
    if (state === "ask_time") {
      bookingRef.current = {
        ...bookingRef.current,
        bookingTime: text,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_cuisine";
      speakAndListen(
        `Perfect. Do you have any cuisine preference? For example, Indian, Italian, Chinese?`
      );
      return;
    }

    // --- ASK CUISINE ---
    if (state === "ask_cuisine") {
      bookingRef.current = {
        ...bookingRef.current,
        cuisinePreference: text,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_special";
      speakAndListen(
        `Noted. Any special requests like a birthday, anniversary, or dietary restrictions?`
      );
      return;
    }

    // --- ASK SPECIAL REQUESTS ---
    if (state === "ask_special") {
      bookingRef.current = {
        ...bookingRef.current,
        specialRequests: text === "no" ? "None" : text,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "ask_city";
      speakAndListen(`Great. Finally, which city are you in?`);
      return;
    }

    // --- ASK CITY ---
    if (state === "ask_city") {
      const city = capitalize(text);

      bookingRef.current = {
        ...bookingRef.current,
        locationCity: city,
      };
      setBookingData(bookingRef.current);

      stateRef.current = "confirming";

      speak(
        `Let me check the weather for ${city} and confirm your booking.`,
        () => sendBookingToBackend()
      );
      return;
    }

    // fallback
    stateRef.current = "ask_name";
    speakAndListen(
      "Sorry, I got confused. Let's start again. What is your name?"
    );
  };

  // -------------------------
  // SEND BOOKING TO BACKEND
  // -------------------------
  const sendBookingToBackend = async () => {
    try {
      const payload = bookingRef.current; // always latest data

      const res = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create booking");
      }

      const result = await res.json();
      const booking = result.booking;

      const msg = `Your table is confirmed, ${booking.customerName}, for ${booking.numberOfGuests} guests on ${booking.bookingDateHuman} at ${booking.bookingTime} with ${booking.seatingPreference} seating. Thank you!`;

      stateRef.current = "complete";
      speak(msg);

      onBookingComplete?.();
    } catch (err) {
      console.error("Booking error:", err);
      speak(
        "Sorry, something went wrong while booking. Please try again in a moment."
      );
      stateRef.current = "idle";
    }
  };

  // -------------------------
  // START CONVERSATION
  // -------------------------
  const startConversation = () => {
    bookingRef.current = {};
    setBookingData({});
    stateRef.current = "ask_name";
    speakAndListen("Hi! Welcome to our restaurant. What is your name?");
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <>
      <button onClick={startConversation}>Start Voice Assistant</button>

      <p className="status">{statusText}</p>

      <div className="panels">
        <div className="panel">
          <h2>You said</h2>
          <p className="box">{userSpeech}</p>
        </div>

        <div className="panel">
          <h2>Assistant</h2>
          <p className="box">{assistantText}</p>
        </div>
      </div>
    </>
  );
};

export default VoiceAssistant;
