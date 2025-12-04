// ---- DOM elements ----
const startBtn = document.getElementById("startBtn");
const refreshBtn = document.getElementById("refreshBtn");
const statusText = document.getElementById("statusText");
const userSpeechEl = document.getElementById("userSpeech");
const assistantTextEl = document.getElementById("assistantText");
const bookingsListEl = document.getElementById("bookingsList");

// ---- Web Speech API Setup ----
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
} else {
  alert(
    "SpeechRecognition API is not supported in this browser. Please use latest Chrome."
  );
}

// ---- Conversation State Machine ----
let state = "idle";
let bookingData = {};

function resetConversation() {
  state = "idle";
  bookingData = {};
}

function speak(text, onEnd) {
  console.log("Assistant:", text);
  assistantTextEl.textContent = text;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => {
    if (typeof onEnd === "function") onEnd();
  };
  window.speechSynthesis.speak(utterance);
}

function speakAndListen(text) {
  speak(text, () => {
    startListening();
  });
}

function startListening() {
  if (!recognition) return;
  statusText.textContent = "Listening... 🎤";
  userSpeechEl.textContent = "";
  recognition.start();
}

if (recognition) {
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log("User:", transcript);
    userSpeechEl.textContent = transcript;
    statusText.textContent = "";
    handleUserInput(transcript.toLowerCase());
  };

  recognition.onend = () => {
    // Auto-stop listening indicator
    statusText.textContent = "";
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    statusText.textContent = "Error with microphone / speech recognition.";
  };
}

function extractNumber(text) {
  const match = text.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (text.includes("two")) return 2;
  if (text.includes("three")) return 3;
  if (text.includes("four")) return 4;
  if (text.includes("five")) return 5;
  return 2; // default
}

function parseDateFromSpeech(text) {
  const now = new Date();
  let date = new Date(now);

  if (text.includes("today")) {
    // keep today
  } else if (text.includes("tomorrow")) {
    date.setDate(now.getDate() + 1);
  } else if (text.includes("day after")) {
    date.setDate(now.getDate() + 2);
  } else {
    // For simplicity, use today if we can't parse
  }

  return date;
}

function capitalize(str) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---- Conversation Logic ----

function startConversation() {
  resetConversation();
  state = "ask_name";
  speakAndListen("Hi! Welcome to our restaurant. May I know your name?");
}

async function handleUserInput(text) {
  switch (state) {
    case "ask_name": {
      bookingData.customerName = capitalize(text);
      state = "ask_guests";
      speakAndListen(
        `Nice to meet you, ${bookingData.customerName}. For how many guests should I book the table?`
      );
      break;
    }
    case "ask_guests": {
      bookingData.numberOfGuests = extractNumber(text);
      state = "ask_date";
      speakAndListen(
        `Got it, ${bookingData.numberOfGuests} guests. For which day would you like the booking? You can say today, tomorrow, or day after tomorrow.`
      );
      break;
    }
    case "ask_date": {
      const dateObj = parseDateFromSpeech(text);
      bookingData.bookingDateISO = dateObj.toISOString();
      bookingData.bookingDateHuman = dateObj.toDateString();

      state = "ask_time";
      speakAndListen(
        `Okay, ${bookingData.bookingDateHuman}. At what time would you like to book?`
      );
      break;
    }
    case "ask_time": {
      bookingData.bookingTime = text;
      state = "ask_cuisine";
      speakAndListen(
        `Great. Do you have any cuisine preference? For example, Indian, Italian, Chinese?`
      );
      break;
    }
    case "ask_cuisine": {
      bookingData.cuisinePreference = text;
      state = "ask_special";
      speakAndListen(
        `Noted. Any special requests? For example, birthday celebration, anniversary, or dietary restrictions?`
      );
      break;
    }
    case "ask_special": {
      bookingData.specialRequests = text === "no" ? "None" : text;
      state = "ask_city";
      speakAndListen(
        `Thanks. Finally, which city are you in? I will check the weather forecast for that location.`
      );
      break;
    }
    case "ask_city": {
      bookingData.locationCity = capitalize(text);
      state = "confirming";

      speak(
        `Let me check the weather for ${bookingData.locationCity} and confirm your booking.`,
        async () => {
          await sendBookingToBackend();
        }
      );
      break;
    }
    case "complete": {
      speakAndListen(
        "If you want to make another booking, you can say start again after clicking the button."
      );
      break;
    }
    default: {
      speakAndListen(
        "Sorry, I got a bit confused. Let's start again. May I know your name?"
      );
      state = "ask_name";
    }
  }
}

// ---- Backend integration ----

async function sendBookingToBackend() {
  try {
    const payload = {
      customerName: bookingData.customerName,
      numberOfGuests: bookingData.numberOfGuests,
      bookingDate: bookingData.bookingDateISO,
      bookingTime: bookingData.bookingTime,
      cuisinePreference: bookingData.cuisinePreference,
      specialRequests: bookingData.specialRequests,
      locationCity: bookingData.locationCity,
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error("Failed to create booking");
    }

    const data = await res.json();
    const booking = data.booking;

    const seating = booking.seatingPreference || "indoor";

    const msg = `Your table is confirmed, ${booking.customerName}, for ${booking.numberOfGuests} guests on ${bookingData.bookingDateHuman} at ${booking.bookingTime}, with ${seating} seating. See you soon!`;

    state = "complete";
    speak(msg);
    loadBookings();
  } catch (err) {
    console.error(err);
    speak(
      "Sorry, I could not complete the booking due to a technical issue. Please try again later."
    );
    state = "idle";
  }
}

// ---- Fetch & display bookings ----

async function loadBookings() {
  try {
    const res = await fetch("/api/bookings");
    const bookings = await res.json();

    bookingsListEl.innerHTML = "";

    if (!bookings.length) {
      bookingsListEl.innerHTML =
        "<li>No bookings yet. Create one using the voice assistant.</li>";
      return;
    }

    bookings.forEach((b) => {
      const li = document.createElement("li");
      li.className = "booking-item";

      const dateStr = new Date(b.bookingDate).toLocaleString();

      li.innerHTML = `
        <div>
          <strong>${b.customerName}</strong> - ${b.numberOfGuests} guests
          <div class="booking-meta">
            ${dateStr} | Time: ${b.bookingTime} | Seating: ${
        b.seatingPreference
      } | Cuisine: ${b.cuisinePreference || "Any"}
          </div>
        </div>
        <button class="delete-btn" data-id="${b._id}">Delete</button>
      `;

      const deleteBtn = li.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", () => deleteBooking(b._id));

      bookingsListEl.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading bookings", err);
  }
}

async function deleteBooking(id) {
  try {
    await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
    });
    loadBookings();
  } catch (err) {
    console.error("Error deleting booking", err);
  }
}

// ---- Event listeners ----

startBtn.addEventListener("click", () => {
  startConversation();
});

refreshBtn.addEventListener("click", () => {
  loadBookings();
});

// Initial load of bookings on page load
loadBookings();
