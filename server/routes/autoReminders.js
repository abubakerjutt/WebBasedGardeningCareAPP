import express from "express";
import AutoRecommendationService from "../services/autoRecommendationService.js";
import Plant from "../models/Plant.js";
import UserPlant from "../models/UserPlant.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get all auto-reminders and care recommendations for user
// @route   GET /api/auto-reminders
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const { includeWeather = true, includeSeasonal = true } = req.query;
    const userId = req.user.id;

    let allRecommendations = [];
    const user = await User.findById(userId).populate("profile");

    // Get user's plants for personalized recommendations
    const userPlants = await UserPlant.find({
      user: userId,
      isActive: true,
    }).populate("plant");

    // Generate plant-specific recommendations
    for (const userPlant of userPlants) {
      if (userPlant.plant) {
        allRecommendations.push(
          ...generatePlantRecommendations(userPlant.plant, user, userPlant)
        );
      }
    }

    // Add weather-based recommendations
    if (includeWeather === "true" && user.profile?.location) {
      try {
        const weatherRecommendations =
          await AutoRecommendationService.generateWeatherBasedRecommendations(
            userId
          );
        if (Array.isArray(weatherRecommendations)) {
          allRecommendations.push(...weatherRecommendations);
        }
      } catch (weatherError) {
        console.log(
          "Weather recommendations unavailable:",
          weatherError.message
        );
        // Add fallback recommendation
        allRecommendations.push({
          type: "weather",
          title: "Weather Service Unavailable",
          description:
            "Unable to fetch weather-based recommendations. Please check your internet connection.",
          priority: "low",
          dueDate: new Date(),
          tags: ["weather-error"],
        });
      }
    }

    // Add seasonal recommendations
    if (includeSeasonal === "true") {
      const seasonalRecommendations = generateSeasonalRecommendations(
        user,
        userPlants
      );
      allRecommendations.push(...seasonalRecommendations);
    }

    // Add location-based recommendations
    if (user.profile?.location) {
      const locationRecommendations = generateLocationBasedRecommendations(
        user,
        userPlants
      );
      allRecommendations.push(...locationRecommendations);
    }

    // Sort by priority and due date
    allRecommendations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff =
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      return (
        new Date(a.dueDate || Date.now()) - new Date(b.dueDate || Date.now())
      );
    });

    res.status(200).json({
      success: true,
      data: {
        reminders: allRecommendations.slice(0, 20), // Limit to 20 most important
        totalCount: allRecommendations.length,
        userLocation: user.profile?.location?.city || "Not set",
        weatherEnabled: includeWeather === "true",
        seasonalEnabled: includeSeasonal === "true",
        plantsCount: userPlants.length,
      },
    });
  } catch (error) {
    console.error("Auto reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch auto reminders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Generate automatic reminders for user
// @route   POST /api/auto-reminders/generate
// @access  Private
router.post("/generate", protect, async (req, res, next) => {
  try {
    const result = await AutoRecommendationService.autoGenerateReminders(
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Automatic reminders generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get weather-based recommendations for user
// @route   GET /api/auto-reminders/weather-recommendations
// @access  Private
router.get("/weather-recommendations", protect, async (req, res, next) => {
  try {
    const recommendations =
      await AutoRecommendationService.generateWeatherBasedRecommendations(
        req.user.id
      );

    res.status(200).json({
      success: true,
      data: { recommendations },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get care reminders for user
// @route   GET /api/auto-reminders/care-reminders
// @access  Private
router.get("/care-reminders", protect, async (req, res, next) => {
  try {
    const reminders = await AutoRecommendationService.generateCareReminders(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: { reminders },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// Helper functions (moved from care.js)
function generatePlantRecommendations(plant, user, userPlant = null) {
  const recommendations = [];

  try {
    if (!plant || !user) {
      return recommendations;
    }

    const now = new Date();
    const plantName = userPlant?.customName || plant.name;

    // Basic watering recommendation
    if (plant.careInstructions?.watering) {
      const lastWatered = userPlant?.lastWatered;
      const wateringFrequency =
        plant.careInstructions.watering.frequency || "weekly";
      let dueDate = new Date();

      // Calculate next watering date
      if (wateringFrequency.includes("daily")) {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (wateringFrequency.includes("weekly")) {
        dueDate.setDate(dueDate.getDate() + 7);
      } else if (wateringFrequency.includes("monthly")) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      recommendations.push({
        type: "watering",
        title: `Water ${plantName}`,
        description:
          plant.careInstructions.watering.instructions ||
          `Water ${plantName} ${wateringFrequency}. Check soil moisture before watering.`,
        priority:
          lastWatered && now - new Date(lastWatered) > 7 * 24 * 60 * 60 * 1000
            ? "high"
            : "medium",
        dueDate,
        plantId: plant._id,
        plantName,
        tags: ["watering", "routine-care"],
      });
    }

    // Fertilizing recommendations
    if (plant.careInstructions?.fertilizing) {
      const season = getSeason();
      if (season === "spring" || season === "summer") {
        recommendations.push({
          type: "fertilizing",
          title: `Fertilize ${plantName}`,
          description:
            plant.careInstructions.fertilizing.instructions ||
            `Apply fertilizer to ${plantName} during growing season.`,
          priority: "medium",
          dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          plantId: plant._id,
          plantName,
          tags: ["fertilizing", "seasonal-care"],
        });
      }
    }

    // Light requirements
    if (plant.careInstructions?.light) {
      const lightNeeds = plant.careInstructions.light.requirements;
      recommendations.push({
        type: "lighting",
        title: `Check Light Conditions for ${plantName}`,
        description: `Ensure ${plantName} receives ${lightNeeds}. Adjust position if needed.`,
        priority: "low",
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        plantId: plant._id,
        plantName,
        tags: ["lighting", "environment"],
      });
    }

    // Pruning recommendations
    if (plant.careInstructions?.pruning) {
      const season = getSeason();
      if (season === "spring" || season === "fall") {
        recommendations.push({
          type: "pruning",
          title: `Prune ${plantName}`,
          description:
            plant.careInstructions.pruning.instructions ||
            `Prune ${plantName} to maintain shape and health.`,
          priority: "low",
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
          plantId: plant._id,
          plantName,
          tags: ["pruning", "seasonal-care"],
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error("Plant recommendations error:", error);
    return recommendations;
  }
}

function generateSeasonalRecommendations(user, userPlants) {
  const recommendations = [];

  try {
    const season = getSeason();
    const now = new Date();

    // Safety check
    if (!user || !Array.isArray(userPlants)) {
      return recommendations;
    }

    switch (season) {
      case "spring":
        recommendations.push({
          type: "seasonal",
          title: "Spring Preparation",
          description:
            "Start fertilizing and increase watering as plants enter growing season.",
          priority: "medium",
          dueDate: now,
          tags: ["spring", "seasonal", "general-care"],
        });
        break;

      case "summer":
        recommendations.push({
          type: "seasonal",
          title: "Summer Care",
          description:
            "Monitor soil moisture closely and provide shade during extreme heat.",
          priority: "high",
          dueDate: now,
          tags: ["summer", "seasonal", "watering"],
        });
        break;

      case "fall":
        recommendations.push({
          type: "seasonal",
          title: "Fall Preparation",
          description:
            "Reduce watering frequency and prepare plants for dormancy.",
          priority: "medium",
          dueDate: now,
          tags: ["fall", "seasonal", "dormancy-prep"],
        });
        break;

      case "winter":
        recommendations.push({
          type: "seasonal",
          title: "Winter Care",
          description: "Reduce watering and protect plants from cold drafts.",
          priority: "medium",
          dueDate: now,
          tags: ["winter", "seasonal", "protection"],
        });
        break;
    }

    return recommendations;
  } catch (error) {
    console.error("Seasonal recommendations error:", error);
    return recommendations;
  }
}

function generateLocationBasedRecommendations(user, userPlants) {
  const recommendations = [];

  try {
    const location = user?.profile?.location;

    if (!location || !user || !Array.isArray(userPlants)) {
      return recommendations;
    }

    // Generate recommendations based on location/climate zone
    const climate = determineClimate(location);
    const now = new Date();

    if (climate === "tropical") {
      recommendations.push({
        type: "location",
        title: "Tropical Climate Care",
        description:
          "Monitor for fungal issues due to high humidity. Ensure good air circulation.",
        priority: "medium",
        dueDate: now,
        tags: ["tropical", "humidity", "fungal-prevention"],
      });
    } else if (climate === "temperate") {
      recommendations.push({
        type: "location",
        title: "Temperate Climate Care",
        description:
          "Adjust watering based on seasonal changes and indoor heating/cooling.",
        priority: "low",
        dueDate: now,
        tags: ["temperate", "seasonal-adjustment"],
      });
    } else if (climate === "arid") {
      recommendations.push({
        type: "location",
        title: "Arid Climate Care",
        description:
          "Increase humidity around plants and monitor soil moisture carefully.",
        priority: "high",
        dueDate: now,
        tags: ["arid", "humidity", "drought-care"],
      });
    }

    return recommendations;
  } catch (error) {
    console.error("Location recommendations error:", error);
    return recommendations;
  }
}

function getSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function determineClimate(location) {
  // Simple climate determination based on location
  const city = location.city?.toLowerCase() || "";
  const country = location.country?.toLowerCase() || "";

  if (
    city.includes("miami") ||
    city.includes("hawaii") ||
    country.includes("thailand") ||
    country.includes("brazil")
  ) {
    return "tropical";
  }

  if (
    city.includes("phoenix") ||
    city.includes("las vegas") ||
    country.includes("saudi") ||
    city.includes("tucson")
  ) {
    return "arid";
  }

  return "temperate"; // Default
}
