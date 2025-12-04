# 🎙️ Voice-Enabled Restaurant Booking Agent (MERN + Voice AI)

This project is my submission for the **Vaiu AI Software Developer Internship Assignment**.  
It demonstrates a complete **voice-driven restaurant booking system** using:

- **React (frontend UI + voice interface)**
- **Node.js + Express (backend API)**
- **MongoDB (database)**
- **OpenWeather API Integration**
- **Web Speech API (Speech-to-Text + Text-to-Speech)**

The agent can **talk to users, listen to them, collect booking details, fetch weather, suggest seating, and store bookings in a database**.

---

# Features

### **Voice Interaction**

- Speech-to-Text (user input)
- Text-to-Speech (assistant replies)
- Continuous conversational loop (speak → listen → process → speak)

### **Restaurant Booking Flow**

The agent collects:

- Customer name
- Number of guests
- Booking date
- Booking time
- Cuisine preference
- Special requests
- City (for weather lookup)

### **Weather Integration**

- Integrates with **OpenWeatherMap API**
- Fetches real weather forecast for the booking date
- Suggests **indoor/outdoor** seating:
  - _“It may rain → I recommend indoor seating.”_
  - _“Weather looks great → Outdoor would be perfect.”_

### **Database Storage (MongoDB)**

All bookings are stored with structure:

```json
{
  "customerName": "Vineeth",
  "numberOfGuests": 4,
  "bookingDate": "2025-03-21T18:00:00.000Z",
  "bookingTime": "7 PM",
  "cuisinePreference": "Indian",
  "specialRequests": "Birthday",
  "weatherInfo": {},
  "seatingPreference": "outdoor",
  "status": "confirmed",
  "createdAt": "2025-03-10T12:45:00.000Z"
}
```
