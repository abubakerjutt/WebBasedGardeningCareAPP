import express from "express";
import axios from "axios";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Test weather API endpoint (no auth required)
// @route   GET /api/weather/test
// @access  Public
router.get("/test", async (req, res) => {
  try {
    const city = req.query.city || "London";
    const weatherUrl = `https://${
      process.env.WEATHER_API_URL
    }/data/2.5/weather?appid=${
      process.env.WEATHER_API_KEY
    }&units=metric&q=${encodeURIComponent(city)}`;

    console.log("Testing weather API with URL:", weatherUrl);

    const response = await axios.get(weatherUrl);

    res.status(200).json({
      success: true,
      message: "Weather API test successful",
      data: {
        city: response.data.name,
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        url: weatherUrl.replace(process.env.WEATHER_API_KEY, "****"),
      },
    });
  } catch (error) {
    console.error(
      "Weather API test error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Weather API test failed",
      error: error.response?.data || error.message,
    });
  }
});

// @desc    Get current weather
// @route   GET /api/weather/current
// @access  Private
router.get("/current", protect, async (req, res, next) => {
  try {
    const { lat, lon, city, location } = req.query;

    // Support both 'city' and 'location' parameters for backward compatibility
    const cityName = city || location;

    // If no location provided, return a default/placeholder response
    if (!lat && !lon && !cityName) {
      return res.status(200).json({
        success: true,
        message: "Please provide location for weather data",
        data: {
          location: "Location not specified",
          temperature: "--",
          description: "Please set your location in profile",
          humidity: "--",
          windSpeed: "--",
          icon: "01d",
        },
      });
    }

    let weatherUrl = `https://${process.env.WEATHER_API_URL}/data/2.5/weather?appid=${process.env.WEATHER_API_KEY}&units=metric`;

    if (lat && lon) {
      weatherUrl += `&lat=${lat}&lon=${lon}`;
    } else if (cityName) {
      weatherUrl += `&q=${encodeURIComponent(cityName)}`;
    }

    const response = await axios.get(weatherUrl);
    const weatherData = response.data;

    // Transform weather data for gardening context
    const gardeningWeather = {
      location: {
        name: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon,
        },
      },
      current: {
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        visibility: weatherData.visibility,
        uvIndex: 0, // Would need additional API call
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind.speed,
        windDirection: weatherData.wind.deg,
        cloudiness: weatherData.clouds.all,
      },
      gardeningAdvice: generateGardeningAdvice(weatherData),
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: { weather: gardeningWeather },
    });
  } catch (error) {
    console.error("Weather API error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch weather data",
    });
  }
});

// @desc    Get weather forecast
// @route   GET /api/weather/forecast
// @access  Private
router.get("/forecast", protect, async (req, res, next) => {
  try {
    const { lat, lon, city, location, days = 5 } = req.query;

    // Support both 'city' and 'location' parameters for backward compatibility
    const cityName = city || location;

    if (!lat && !lon && !cityName) {
      return res.status(400).json({
        success: false,
        message: "Please provide either coordinates (lat, lon) or city name",
      });
    }

    let forecastUrl = `https://${process.env.WEATHER_API_URL}/data/2.5/forecast?appid=${process.env.WEATHER_API_KEY}&units=metric`;

    if (lat && lon) {
      forecastUrl += `&lat=${lat}&lon=${lon}`;
    } else if (cityName) {
      forecastUrl += `&q=${encodeURIComponent(cityName)}`;
    }

    const response = await axios.get(forecastUrl);
    const forecastData = response.data;

    // Process forecast data
    const dailyForecast = processForecastData(forecastData, parseInt(days));

    res.status(200).json({
      success: true,
      data: {
        forecast: dailyForecast,
        location: {
          name: forecastData.city.name,
          country: forecastData.city.country,
        },
      },
    });
  } catch (error) {
    console.error(
      "Weather forecast error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Unable to fetch weather forecast",
    });
  }
});

// @desc    Get gardening calendar
// @route   GET /api/weather/gardening-calendar
// @access  Private
router.get("/gardening-calendar", async (req, res, next) => {
  try {
    const { lat, lon, month } = req.query;

    // This would typically integrate with a more comprehensive gardening database
    // For now, we'll provide general seasonal advice
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const gardeningCalendar = getGardeningCalendar(currentMonth, lat, lon);

    res.status(200).json({
      success: true,
      data: { calendar: gardeningCalendar },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get UV index
// @route   GET /api/weather/uv-index
// @access  Private
router.get("/uv-index", async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Note: OpenWeather UV Index API requires a different endpoint
    const uvUrl = `${process.env.WEATHER_API_URL}/uvi?appid=${process.env.WEATHER_API_KEY}&lat=${lat}&lon=${lon}`;

    const response = await axios.get(uvUrl);
    const uvData = response.data;

    const uvAdvice = getUVAdvice(uvData.value);

    res.status(200).json({
      success: true,
      data: {
        uvIndex: uvData.value,
        advice: uvAdvice,
        timestamp: new Date(uvData.date * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("UV Index error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch UV index data",
    });
  }
});

// Helper function to generate gardening advice based on weather
function generateGardeningAdvice(weatherData) {
  const advice = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const condition = weatherData.weather[0].main.toLowerCase();

  // Temperature-based advice
  if (temp < 5) {
    advice.push({
      type: "warning",
      message:
        "Protect tender plants from frost. Consider bringing potted plants indoors.",
    });
  } else if (temp > 30) {
    advice.push({
      type: "warning",
      message:
        "Very hot weather. Ensure plants are well-watered and provide shade if possible.",
    });
  }

  // Humidity-based advice
  if (humidity > 80) {
    advice.push({
      type: "info",
      message:
        "High humidity may increase fungal disease risk. Ensure good air circulation.",
    });
  } else if (humidity < 30) {
    advice.push({
      type: "info",
      message: "Low humidity. Consider misting humidity-loving plants.",
    });
  }

  // Weather condition advice
  if (condition.includes("rain")) {
    advice.push({
      type: "info",
      message:
        "Rainy weather - perfect for planting! Hold off on watering outdoor plants.",
    });
  } else if (condition.includes("sun")) {
    advice.push({
      type: "success",
      message: "Great weather for outdoor gardening activities!",
    });
  }

  return advice;
}

// Helper function to process forecast data
function processForecastData(forecastData, days) {
  const dailyData = {};

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();

    if (!dailyData[date]) {
      dailyData[date] = {
        date: date,
        temperature: {
          min: item.main.temp,
          max: item.main.temp,
          avg: item.main.temp,
        },
        humidity: item.main.humidity,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        windSpeed: item.wind.speed,
        precipitation: item.rain ? item.rain["3h"] || 0 : 0,
        gardeningTips: [],
      };
    } else {
      dailyData[date].temperature.min = Math.min(
        dailyData[date].temperature.min,
        item.main.temp
      );
      dailyData[date].temperature.max = Math.max(
        dailyData[date].temperature.max,
        item.main.temp
      );
    }
  });

  // Add gardening tips for each day
  Object.values(dailyData).forEach((day) => {
    day.gardeningTips = generateDailyGardeningTips(day);
  });

  return Object.values(dailyData).slice(0, days);
}

// Helper function to generate daily gardening tips
function generateDailyGardeningTips(dayData) {
  const tips = [];

  if (dayData.precipitation > 0) {
    tips.push("Skip watering today - rain will take care of it!");
  }

  if (dayData.temperature.max > 25) {
    tips.push(
      "Water plants early morning or late evening to avoid evaporation."
    );
  }

  if (dayData.temperature.min < 10) {
    tips.push("Protect sensitive plants from cold temperatures.");
  }

  return tips;
}

// Helper function to get gardening calendar
function getGardeningCalendar(month, lat, lon) {
  // Simplified seasonal advice - in a real app, this would be more location-specific
  const isNorthernHemisphere = !lat || parseFloat(lat) > 0;

  const monthlyTasks = {
    1: {
      // January
      northern: [
        "Plan garden layout",
        "Start seeds indoors",
        "Prune dormant trees",
      ],
      southern: [
        "Harvest summer crops",
        "Plant cool-season vegetables",
        "Water regularly",
      ],
    },
    2: {
      // February
      northern: [
        "Start more seeds indoors",
        "Plan crop rotation",
        "Check garden tools",
      ],
      southern: [
        "Continue harvesting",
        "Plant autumn vegetables",
        "Prepare for cooler weather",
      ],
    },
    3: {
      // March
      northern: [
        "Start cool-season crops",
        "Prepare garden beds",
        "Begin hardening seedlings",
      ],
      southern: [
        "Plant cool-season crops",
        "Harvest late summer produce",
        "Start winter preparations",
      ],
    },
    4: {
      // April
      northern: [
        "Plant cool-season vegetables",
        "Start warm-season seeds",
        "Begin regular watering",
      ],
      southern: [
        "Harvest root vegetables",
        "Plant winter crops",
        "Reduce watering frequency",
      ],
    },
    5: {
      // May
      northern: [
        "Plant warm-season crops",
        "Mulch garden beds",
        "Begin pest monitoring",
      ],
      southern: [
        "Harvest winter crops",
        "Plant spring vegetables",
        "Prepare for dry season",
      ],
    },
    6: {
      // June
      northern: [
        "Maintain garden",
        "Regular watering and fertilizing",
        "First harvest of early crops",
      ],
      southern: [
        "Plant cool-season crops",
        "Mulch for winter",
        "Prune deciduous trees",
      ],
    },
    7: {
      // July
      northern: [
        "Harvest summer crops",
        "Water deeply and regularly",
        "Start fall planning",
      ],
      southern: [
        "Harvest winter vegetables",
        "Plan spring garden",
        "Start seeds for spring",
      ],
    },
    8: {
      // August
      northern: [
        "Continue harvesting",
        "Start fall seeds",
        "Begin preserving produce",
      ],
      southern: [
        "Continue spring planting",
        "Start warm-season seeds",
        "Prepare irrigation",
      ],
    },
    9: {
      // September
      northern: [
        "Plant fall crops",
        "Harvest and preserve",
        "Begin garden cleanup",
      ],
      southern: [
        "Plant warm-season vegetables",
        "Start seedlings for summer",
        "Increase watering",
      ],
    },
    10: {
      // October
      northern: [
        "Harvest fall crops",
        "Plant garlic and onions",
        "Begin winter preparations",
      ],
      southern: [
        "Harvest spring crops",
        "Plant summer vegetables",
        "Set up shade cloth",
      ],
    },
    11: {
      // November
      northern: [
        "Final harvest",
        "Protect plants from frost",
        "Plan next year's garden",
      ],
      southern: [
        "Harvest early summer crops",
        "Plant heat-tolerant varieties",
        "Maintain regular watering",
      ],
    },
    12: {
      // December
      northern: ["Plan next year", "Maintain tools", "Study seed catalogs"],
      southern: [
        "Harvest summer crops",
        "Plant cool-season varieties",
        "Monitor for pests",
      ],
    },
  };

  const tasks = monthlyTasks[month];
  return {
    month: month,
    hemisphere: isNorthernHemisphere ? "northern" : "southern",
    tasks: isNorthernHemisphere ? tasks.northern : tasks.southern,
    season: getSeason(month, isNorthernHemisphere),
  };
}

// Helper function to get season
function getSeason(month, isNorthern) {
  if (isNorthern) {
    if (month >= 3 && month <= 5) return "Spring";
    if (month >= 6 && month <= 8) return "Summer";
    if (month >= 9 && month <= 11) return "Fall";
    return "Winter";
  } else {
    if (month >= 3 && month <= 5) return "Fall";
    if (month >= 6 && month <= 8) return "Winter";
    if (month >= 9 && month <= 11) return "Spring";
    return "Summer";
  }
}

// Helper function to get UV advice
function getUVAdvice(uvIndex) {
  if (uvIndex <= 2) {
    return {
      level: "Low",
      advice:
        "Safe for outdoor gardening activities. No special precautions needed.",
    };
  } else if (uvIndex <= 5) {
    return {
      level: "Moderate",
      advice:
        "Take basic precautions. Wear a hat and apply sunscreen for extended outdoor work.",
    };
  } else if (uvIndex <= 7) {
    return {
      level: "High",
      advice:
        "Protection required. Wear protective clothing, hat, and sunscreen. Seek shade during midday.",
    };
  } else if (uvIndex <= 10) {
    return {
      level: "Very High",
      advice:
        "Extra protection needed. Avoid outdoor gardening during midday hours (10am-4pm).",
    };
  } else {
    return {
      level: "Extreme",
      advice:
        "Take all precautions. Avoid outdoor activities during peak hours. If you must garden, wear full protection.",
    };
  }
}

export default router;
