import axios from "axios";

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "demo_key";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5";

export const getCurrentWeather = async (lat, lon) => {
  try {
    // If no API key is set, return mock data
    if (WEATHER_API_KEY === "demo_key") {
      return {
        temperature: 22,
        humidity: 65,
        description: "partly cloudy",
        windSpeed: 5,
        pressure: 1013,
        uvIndex: 5,
        visibility: 10,
        condition: "clouds",
      };
    }

    const response = await axios.get(`${WEATHER_API_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: "metric",
      },
    });

    const data = response.data;
    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed || 0,
      pressure: data.main.pressure,
      uvIndex: data.uvi || 5, // UV index not available in current weather
      visibility: data.visibility / 1000, // Convert from meters to km
      condition: data.weather[0].main.toLowerCase(),
    };
  } catch (error) {
    console.error("Weather API error:", error.message);
    // Return default weather data if API fails
    return {
      temperature: 20,
      humidity: 60,
      description: "clear sky",
      windSpeed: 3,
      pressure: 1013,
      uvIndex: 5,
      visibility: 10,
      condition: "clear",
    };
  }
};

export const getWeatherForecast = async (lat, lon, days = 5) => {
  try {
    // If no API key is set, return mock data
    if (WEATHER_API_KEY === "demo_key") {
      return Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        temperature: { min: 15 + i, max: 25 + i },
        humidity: 60 + i * 5,
        description: [
          "sunny",
          "partly cloudy",
          "cloudy",
          "light rain",
          "clear",
        ][i % 5],
        precipitation: i === 3 ? 2.5 : 0,
        windSpeed: 3 + i,
        condition: ["clear", "clouds", "clouds", "rain", "clear"][i % 5],
      }));
    }

    const response = await axios.get(`${WEATHER_API_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: "metric",
        cnt: days * 8, // 8 forecasts per day (3-hour intervals)
      },
    });

    const forecasts = response.data.list;
    const dailyForecasts = [];

    // Group forecasts by day
    const forecastsByDay = {};
    forecasts.forEach((forecast) => {
      const date = forecast.dt_txt.split(" ")[0];
      if (!forecastsByDay[date]) {
        forecastsByDay[date] = [];
      }
      forecastsByDay[date].push(forecast);
    });

    // Process each day
    Object.keys(forecastsByDay)
      .slice(0, days)
      .forEach((date) => {
        const dayForecasts = forecastsByDay[date];
        const temps = dayForecasts.map((f) => f.main.temp);
        const humidity =
          dayForecasts.reduce((sum, f) => sum + f.main.humidity, 0) /
          dayForecasts.length;
        const precipitation = dayForecasts.reduce(
          (sum, f) => sum + (f.rain ? f.rain["3h"] || 0 : 0),
          0
        );
        const wind =
          dayForecasts.reduce((sum, f) => sum + f.wind.speed, 0) /
          dayForecasts.length;

        dailyForecasts.push({
          date,
          temperature: {
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
          },
          humidity: Math.round(humidity),
          description: dayForecasts[0].weather[0].description,
          precipitation: Math.round(precipitation * 10) / 10,
          windSpeed: Math.round(wind * 10) / 10,
          condition: dayForecasts[0].weather[0].main.toLowerCase(),
        });
      });

    return dailyForecasts;
  } catch (error) {
    console.error("Weather forecast API error:", error.message);
    // Return default forecast data if API fails
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      temperature: { min: 15, max: 25 },
      humidity: 60,
      description: "partly cloudy",
      precipitation: 0,
      windSpeed: 3,
      condition: "clouds",
    }));
  }
};

export const getLocationFromCity = async (city) => {
  try {
    if (WEATHER_API_KEY === "demo_key") {
      // Return coordinates for a default city (London)
      return { lat: 51.5074, lon: -0.1278, name: city };
    }

    const response = await axios.get(`${WEATHER_API_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        limit: 1,
      },
    });

    const data = response.data;
    return {
      lat: data.coord.lat,
      lon: data.coord.lon,
      name: data.name,
    };
  } catch (error) {
    console.error("Geocoding API error:", error.message);
    // Return default coordinates if API fails
    return { lat: 51.5074, lon: -0.1278, name: city };
  }
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getLocationFromCity,
};
