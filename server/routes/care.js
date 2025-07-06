import express from "express";
import Plant from "../models/Plant.js";
import UserPlant from "../models/UserPlant.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  getCurrentWeather,
  getWeatherForecast,
} from "../services/weatherService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get plant care schedule
// @route   GET /api/care/schedule
// @access  Private
router.get("/schedule", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date, plantId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Find user's plants
    const userPlants = await UserPlant.find({
      user: userId,
      isActive: true,
    })
      .populate("plant")
      .lean();

    const schedule = [];

    for (const userPlant of userPlants) {
      if (plantId && userPlant.plant._id.toString() !== plantId) continue;

      // Generate basic schedule for the plant
      const plantSchedule = generatePlantSchedule(userPlant, targetDate);
      schedule.push(...plantSchedule);
    }

    // Sort by priority and time
    schedule.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    res.status(200).json({
      success: true,
      data: {
        schedule,
        date: targetDate.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Log care activity
// @route   POST /api/care/log
// @access  Private
router.post("/log", async (req, res, next) => {
  try {
    const { plantId, activityType, notes, photos } = req.body;

    const userPlant = await UserPlant.findOne({
      _id: plantId,
      user: req.user.id,
      isActive: true,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    await userPlant.addCareHistory(activityType, notes || "", photos || []);

    // Update last care dates based on activity type if needed
    // This can be expanded based on your application's needs

    res.status(201).json({
      success: true,
      message: "Care activity logged successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get care history
// @route   GET /api/care/history
// @access  Private
router.get("/history", async (req, res, next) => {
  try {
    const { plantId, limit = 50 } = req.query;

    const query = {
      user: req.user.id,
      isActive: true,
    };

    if (plantId) {
      query._id = plantId;
    }

    const userPlants = await UserPlant.find(query)
      .populate("plant", "name images")
      .lean();

    let allCareHistory = [];

    for (const userPlant of userPlants) {
      const careHistory = (userPlant.careHistory || []).map((log) => ({
        ...log,
        plantId: userPlant._id,
        plantName: userPlant.customName || userPlant.plant.name,
        plantImage: userPlant.plant.images?.[0]?.url,
      }));

      allCareHistory.push(...careHistory);
    }

    // Sort by date (newest first)
    allCareHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit results
    allCareHistory = allCareHistory.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: { careHistory: allCareHistory },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create care reminder
// @route   POST /api/care/reminders
// @access  Private
router.post("/reminders", async (req, res, next) => {
  try {
    const { plantId, type, title, message, frequency, startDate, endDate } =
      req.body;

    // Validate plant ownership
    const userPlant = await UserPlant.findOne({
      _id: plantId,
      user: req.user.id,
      isActive: true,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    // Create notification
    const reminder = await Notification.create({
      recipient: req.user.id,
      type: "care_reminder",
      title,
      message,
      data: {
        userPlantId: plantId,
        careType: type,
        frequency,
        startDate,
        endDate,
      },
      priority: "medium",
      scheduledFor: new Date(startDate),
    });

    // Add reminder to user plant
    await userPlant.addReminder({
      type,
      title,
      description: message,
      dueDate: new Date(startDate),
      isRecurring: frequency !== "custom",
      recurringInterval: frequency !== "custom" ? frequency : null,
    });

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: { reminder },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Plant identification (AI placeholder)
// @route   POST /api/care/identify
// @access  Private
router.post("/identify", async (req, res, next) => {
  try {
    // TODO: Integrate with AI plant identification service
    // This would analyze uploaded images and return:
    // - Plant species identification
    // - Confidence level
    // - Care recommendations
    // - Common issues and solutions

    res.status(200).json({
      success: true,
      message: "AI plant identification coming soon",
      data: {
        identification: null,
        confidence: 0,
        suggestions: [
          "Upload a clear photo of the plant",
          "Include leaves, flowers, or distinctive features",
          "Ensure good lighting for better results",
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate plant schedule
function generatePlantSchedule(userPlant, targetDate) {
  const schedule = [];
  const plant = userPlant.plant;
  const plantName = userPlant.customName || plant.name;

  try {
    // Basic watering schedule
    if (plant.careInstructions?.watering) {
      const frequency = plant.careInstructions.watering.frequency || "weekly";
      let priority = "medium";

      // Check if watering is overdue
      const lastWatered = userPlant.lastWatered;
      if (lastWatered) {
        const daysSinceWatered = Math.floor(
          (targetDate - new Date(lastWatered)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceWatered > 7) priority = "high";
        if (daysSinceWatered > 14) priority = "urgent";
      }

      schedule.push({
        id: `${userPlant._id}-watering`,
        type: "watering",
        title: `Water ${plantName}`,
        description:
          plant.careInstructions.watering.instructions ||
          `Water ${plantName} ${frequency}`,
        priority,
        time: "08:00",
        plantId: userPlant._id,
        plantName,
      });
    }

    // Basic fertilizing schedule (seasonal)
    if (plant.careInstructions?.fertilizing) {
      const month = targetDate.getMonth();
      // Fertilize during growing season (spring/summer)
      if (month >= 2 && month <= 8) {
        schedule.push({
          id: `${userPlant._id}-fertilizing`,
          type: "fertilizing",
          title: `Fertilize ${plantName}`,
          description:
            plant.careInstructions.fertilizing.instructions ||
            `Apply fertilizer to ${plantName}`,
          priority: "low",
          time: "10:00",
          plantId: userPlant._id,
          plantName,
        });
      }
    }

    // Basic pruning schedule
    if (plant.careInstructions?.pruning) {
      const month = targetDate.getMonth();
      // Prune in spring or fall
      if (month === 2 || month === 3 || month === 9 || month === 10) {
        schedule.push({
          id: `${userPlant._id}-pruning`,
          type: "pruning",
          title: `Prune ${plantName}`,
          description:
            plant.careInstructions.pruning.instructions ||
            `Prune ${plantName} for health and shape`,
          priority: "low",
          time: "14:00",
          plantId: userPlant._id,
          plantName,
        });
      }
    }

    return schedule;
  } catch (error) {
    console.error("Error generating plant schedule:", error);
    return schedule;
  }
}

export default router;
