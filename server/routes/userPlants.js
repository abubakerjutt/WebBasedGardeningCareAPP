import express from "express";
import UserPlant from "../models/UserPlant.js";
import Plant from "../models/Plant.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get user's plants
// @route   GET /api/user-plants
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: req.user.id, isActive: true };
    if (status) query.status = status;

    const userPlants = await UserPlant.find(query)
      .populate("plant", "name scientificName category images careInstructions")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserPlant.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        plants: userPlants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single user plant
// @route   GET /api/user-plants/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("plant");

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    res.status(200).json({
      success: true,
      data: { plant: userPlant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add plant to user's collection
// @route   POST /api/user-plants
// @access  Private
router.post("/", protect, async (req, res, next) => {
  try {
    const { plantId, customName, location, notes } = req.body;

    // Check if plant exists
    const plant = await Plant.findById(plantId);
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in database",
      });
    }

    // Check if user already has this plant
    const existingUserPlant = await UserPlant.findOne({
      user: req.user.id,
      plant: plantId,
    });

    if (existingUserPlant) {
      return res.status(400).json({
        success: false,
        message: "Plant already exists in your collection",
      });
    }

    const userPlant = await UserPlant.create({
      user: req.user.id,
      plant: plantId,
      customName,
      location,
      notes,
    });

    await userPlant.populate("plant", "name scientificName category images");

    res.status(201).json({
      success: true,
      message: "Plant added to your collection",
      data: { plant: userPlant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user plant
// @route   PUT /api/user-plants/:id
// @access  Private
router.put("/:id", protect, async (req, res, next) => {
  try {
    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    const updatedPlant = await UserPlant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("plant");

    res.status(200).json({
      success: true,
      message: "Plant updated successfully",
      data: { plant: updatedPlant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove plant from user's collection
// @route   DELETE /api/user-plants/:id
// @access  Private
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    userPlant.isActive = false;
    await userPlant.save();

    res.status(200).json({
      success: true,
      message: "Plant removed from your collection",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add reminder to user plant
// @route   POST /api/user-plants/:id/reminders
// @access  Private
router.post("/:id/reminders", protect, async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      dueDate,
      isRecurring,
      recurringInterval,
    } = req.body;

    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    await userPlant.addReminder({
      type,
      title,
      description,
      dueDate: new Date(dueDate),
      isRecurring,
      recurringInterval,
    });

    res.status(201).json({
      success: true,
      message: "Reminder added successfully",
      data: { plant: userPlant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete reminder
// @route   PUT /api/user-plants/:id/reminders/:reminderId/complete
// @access  Private
router.put(
  "/:id/reminders/:reminderId/complete",
  protect,
  async (req, res, next) => {
    try {
      const userPlant = await UserPlant.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!userPlant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found in your collection",
        });
      }

      await userPlant.completeReminder(req.params.reminderId);

      res.status(200).json({
        success: true,
        message: "Reminder completed successfully",
        data: { plant: userPlant },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Add care history
// @route   POST /api/user-plants/:id/care-history
// @access  Private
router.post("/:id/care-history", protect, async (req, res, next) => {
  try {
    const { action, description, notes } = req.body;

    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in your collection",
      });
    }

    await userPlant.addCareHistory(action, description, notes);

    res.status(201).json({
      success: true,
      message: "Care history added successfully",
      data: { plant: userPlant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming reminders
// @route   GET /api/user-plants/reminders/upcoming
// @access  Private
router.get("/reminders/upcoming", protect, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + parseInt(days));

    const userPlants = await UserPlant.find({
      user: req.user.id,
      isActive: true,
      "reminders.dueDate": { $lte: upcomingDate },
      "reminders.isCompleted": false,
    }).populate("plant", "name images");

    const reminders = [];
    userPlants.forEach((userPlant) => {
      userPlant.reminders.forEach((reminder) => {
        if (!reminder.isCompleted && reminder.dueDate <= upcomingDate) {
          reminders.push({
            ...reminder.toObject(),
            userPlant: {
              _id: userPlant._id,
              customName: userPlant.customName,
              plant: userPlant.plant,
            },
          });
        }
      });
    });

    reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: { reminders },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add observation to user plant
// @route   POST /api/user-plants/:id/observations
// @access  Private
router.post("/:id/observations", protect, async (req, res, next) => {
  try {
    const { title, description, images } = req.body;

    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "User plant not found",
      });
    }

    const observationData = {
      title,
      description,
      images: images || [],
    };

    await userPlant.addObservation(observationData);

    res.status(201).json({
      success: true,
      message: "Observation added successfully",
      data: {
        observation: userPlant.observations[userPlant.observations.length - 1],
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get observations for user plant
// @route   GET /api/user-plants/:id/observations
// @access  Private
router.get("/:id/observations", protect, async (req, res, next) => {
  try {
    const userPlant = await UserPlant.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    }).populate("observations.supervisorFeedback.reviewedBy", "name role");

    if (!userPlant) {
      return res.status(404).json({
        success: false,
        message: "User plant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { observations: userPlant.observations },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update observation feedback (Supervisor only)
// @route   PUT /api/user-plants/:plantId/observations/:observationId/feedback
// @access  Private (Supervisor/Admin)
router.put(
  "/:plantId/observations/:observationId/feedback",
  protect,
  authorize("supervisor", "admin"),
  async (req, res, next) => {
    try {
      const { message, status } = req.body;

      const userPlant = await UserPlant.findOne({
        _id: req.params.plantId,
        isActive: true,
      });

      if (!userPlant) {
        return res.status(404).json({
          success: false,
          message: "User plant not found",
        });
      }

      const feedback = {
        message,
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      };

      await userPlant.updateObservationFeedback(
        req.params.observationId,
        feedback
      );

      res.status(200).json({
        success: true,
        message: "Observation feedback updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
