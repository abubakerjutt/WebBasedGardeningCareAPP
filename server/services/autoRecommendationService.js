import UserPlant from "../models/UserPlant.js";
import User from "../models/User.js";
import AutoRecommendation from "../models/AutoRecommendation.js";
import { getCurrentWeather } from "./weatherService.js";
import axios from "axios";

class AutoRecommendationService {
  // Generate automatic recommendations based on weather and plant care schedules
  static async generateWeatherBasedRecommendations(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.profile?.location) {
        return [];
      }

      // Get current weather for user's location
      const weather = await getCurrentWeather(
        user.profile.location.city || user.profile.location.address
      );
      if (!weather) return [];

      const userPlants = await UserPlant.find({
        user: userId,
        isActive: true,
      }).populate("plant");

      const recommendations = [];

      for (const userPlant of userPlants) {
        const plantRecommendations = this.analyzeWeatherForPlant(
          userPlant,
          weather
        );
        recommendations.push(...plantRecommendations);
      }

      return recommendations;
    } catch (error) {
      console.error("Error generating weather-based recommendations:", error);
      return [];
    }
  }

  // Analyze weather conditions for a specific plant
  static analyzeWeatherForPlant(userPlant, weather) {
    const recommendations = [];
    const plant = userPlant.plant;
    const now = new Date();

    // Temperature-based recommendations
    if (weather.temperature < 5) {
      recommendations.push({
        type: "care",
        title: "Cold Weather Protection",
        description: `Protect ${
          userPlant.customName || plant.name
        } from freezing temperatures. Consider moving indoors or covering with frost cloth.`,
        priority: "high",
        dueDate: now,
        tags: ["cold-protection", "weather-alert"],
      });
    }

    if (weather.temperature > 35) {
      recommendations.push({
        type: "care",
        title: "Heat Stress Prevention",
        description: `Provide extra shade and increase watering frequency for ${
          userPlant.customName || plant.name
        } during this heat wave.`,
        priority: "high",
        dueDate: now,
        tags: ["heat-protection", "weather-alert"],
      });
    }

    // Humidity-based recommendations
    if (weather.humidity < 30) {
      recommendations.push({
        type: "care",
        title: "Low Humidity Alert",
        description: `Increase humidity around ${
          userPlant.customName || plant.name
        } by misting or using a humidity tray.`,
        priority: "medium",
        dueDate: now,
        tags: ["humidity", "care"],
      });
    }

    // Rain-based recommendations
    if (
      weather.description?.includes("rain") ||
      weather.description?.includes("storm")
    ) {
      recommendations.push({
        type: "care",
        title: "Rain Protection",
        description: `Move ${
          userPlant.customName || plant.name
        } to a covered area if it's sensitive to overwatering.`,
        priority: "medium",
        dueDate: now,
        tags: ["rain-protection", "weather"],
      });

      // Adjust watering schedule
      const nextWateringDate = new Date();
      nextWateringDate.setDate(nextWateringDate.getDate() + 2);

      recommendations.push({
        type: "care",
        title: "Adjust Watering Schedule",
        description: `Skip or delay watering for ${
          userPlant.customName || plant.name
        } due to recent rainfall.`,
        priority: "low",
        dueDate: nextWateringDate,
        tags: ["watering", "schedule-adjustment"],
      });
    }

    // Wind-based recommendations
    if (weather.windSpeed > 20) {
      // Strong wind (km/h)
      recommendations.push({
        type: "care",
        title: "Wind Protection",
        description: `Secure or move ${
          userPlant.customName || plant.name
        } to protect from strong winds that could damage stems or roots.`,
        priority: "medium",
        dueDate: now,
        tags: ["wind-protection", "weather-alert"],
      });
    }

    return recommendations;
  }

  // Generate care reminders based on plant care instructions and last care activities
  static async generateCareReminders(userId) {
    try {
      const userPlants = await UserPlant.find({
        user: userId,
        isActive: true,
      }).populate("plant");

      const reminders = [];

      for (const userPlant of userPlants) {
        const plantReminders = this.analyzeCareSchedule(userPlant);
        reminders.push(...plantReminders);
      }

      return reminders;
    } catch (error) {
      console.error("Error generating care reminders:", error);
      return [];
    }
  }

  // Analyze care schedule for a specific plant
  static analyzeCareSchedule(userPlant) {
    const reminders = [];
    const plant = userPlant.plant;
    const now = new Date();

    // Watering reminders
    if (plant.careInstructions?.watering) {
      const lastWatered =
        userPlant.customCareInstructions?.watering?.lastWatered ||
        userPlant.plantedDate;
      const wateringFrequency =
        userPlant.customCareInstructions?.watering?.frequency ||
        plant.careInstructions.watering.frequency;

      const nextWateringDate = this.calculateNextDate(
        lastWatered,
        wateringFrequency
      );

      if (nextWateringDate <= now) {
        reminders.push({
          type: "watering",
          title: `Water ${userPlant.customName || plant.name}`,
          description: `It's time to water your ${plant.name}. ${
            plant.careInstructions.watering.notes || ""
          }`,
          dueDate: nextWateringDate,
          isRecurring: true,
          recurringInterval: this.mapFrequencyToInterval(wateringFrequency),
        });
      }
    }

    // Fertilizing reminders
    if (plant.careInstructions?.fertilizing) {
      const lastFertilized =
        userPlant.customCareInstructions?.fertilizing?.lastFertilized ||
        userPlant.plantedDate;
      const fertilizingFrequency =
        userPlant.customCareInstructions?.fertilizing?.frequency ||
        plant.careInstructions.fertilizing.frequency;

      if (fertilizingFrequency) {
        const nextFertilizingDate = this.calculateNextDate(
          lastFertilized,
          fertilizingFrequency
        );

        if (nextFertilizingDate <= now) {
          reminders.push({
            type: "fertilizing",
            title: `Fertilize ${userPlant.customName || plant.name}`,
            description: `Time to fertilize your ${plant.name}. ${
              plant.careInstructions.fertilizing.notes || ""
            }`,
            dueDate: nextFertilizingDate,
            isRecurring: true,
            recurringInterval:
              this.mapFrequencyToInterval(fertilizingFrequency),
          });
        }
      }
    }

    // Seasonal care reminders
    const currentSeason = this.getCurrentSeason();
    if (plant.season?.planting?.includes(currentSeason)) {
      reminders.push({
        type: "maintenance",
        title: `Optimal Planting Season for ${plant.name}`,
        description: `This is an ideal time to plant or propagate ${plant.name}.`,
        dueDate: now,
        priority: "medium",
        tags: ["seasonal", "planting"],
      });
    }

    if (plant.season?.harvesting?.includes(currentSeason)) {
      reminders.push({
        type: "harvesting",
        title: `Harvest Time for ${userPlant.customName || plant.name}`,
        description: `Check if your ${plant.name} is ready for harvesting.`,
        dueDate: now,
        priority: "medium",
        tags: ["seasonal", "harvest"],
      });
    }

    return reminders;
  }

  // Calculate next date based on frequency
  static calculateNextDate(lastDate, frequency) {
    const nextDate = new Date(lastDate);

    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "every-2-days":
        nextDate.setDate(nextDate.getDate() + 2);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "bi-weekly":
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "seasonal":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "annually":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }

    return nextDate;
  }

  // Map frequency to recurring interval
  static mapFrequencyToInterval(frequency) {
    const mapping = {
      daily: "daily",
      "every-2-days": "daily", // Will be handled in logic
      weekly: "weekly",
      "bi-weekly": "bi-weekly",
      monthly: "monthly",
      seasonal: "seasonal",
      annually: "annually",
    };

    return mapping[frequency] || "weekly";
  }

  // Get current season
  static getCurrentSeason() {
    const month = new Date().getMonth();

    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  // Auto-generate and add reminders for a user
  static async autoGenerateReminders(userId) {
    try {
      const weatherRecommendations =
        await this.generateWeatherBasedRecommendations(userId);
      const careReminders = await this.generateCareReminders(userId);

      const userPlants = await UserPlant.find({
        user: userId,
        isActive: true,
      });

      // Add reminders to user plants
      for (const reminder of [...weatherRecommendations, ...careReminders]) {
        // Find the appropriate user plant for this reminder
        const userPlant = userPlants.find((up) =>
          reminder.title.includes(up.customName || up.plant?.name)
        );

        if (userPlant) {
          await userPlant.addReminder(reminder);
        }
      }

      return {
        weatherRecommendations: weatherRecommendations.length,
        careReminders: careReminders.length,
        totalGenerated: weatherRecommendations.length + careReminders.length,
      };
    } catch (error) {
      console.error("Error auto-generating reminders:", error);
      return { error: error.message };
    }
  }
}

export default AutoRecommendationService;
