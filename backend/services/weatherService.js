const axios = require("axios");

/**
 * Get weather forecast info for a given date & city.
 * For simplicity, we pick the first forecast entry from OpenWeatherMap 5-day/3h forecast.
 */
async function getWeatherForDate(bookingDate, city) {
  const API_KEY = process.env.WEATHER_API_KEY;
  if (!API_KEY) {
    throw new Error("WEATHER_API_KEY is not set in .env");
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;

  const res = await axios.get(url);

  const list = res.data.list;
  if (!Array.isArray(list) || list.length === 0) {
    return {
      condition: "unknown",
      description: "no data",
      temp: null,
      raw: res.data,
    };
  }

  // In a real app, you'd match bookingDate to the closest forecast time.
  // For this assignment, keep it simple and use the first forecast slot.
  const forecast = list[0];

  const condition =
    forecast.weather && forecast.weather[0] && forecast.weather[0].main
      ? forecast.weather[0].main
      : "unknown";

  const description =
    forecast.weather && forecast.weather[0] && forecast.weather[0].description
      ? forecast.weather[0].description
      : "unknown";

  const temp = forecast.main && forecast.main.temp ? forecast.main.temp : null;

  return {
    condition,
    description,
    temp,
    raw: forecast,
  };
}

module.exports = {
  getWeatherForDate,
};
