import express from "express";
import Recommendation from "../models/Recommendation.js";
import UserPlant from "../models/UserPlant.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get recommendations (different based on role)
// @route   GET /api/recommendations
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;

    let recommendations;

    if (req.user.role === "supervisor" || req.user.role === "gardener") {
      // Supervisor sees recommendations they created
      recommendations = await Recommendation.getSupervisorHistory(req.user.id, {
        status,
        priority,
      })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    } else {
      // Users see recommendations for them
      recommendations = await Recommendation.getUserRecommendations(
        req.user.id,
        { status, priority }
      )
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const query =
      req.user.role === "supervisor" || req.user.role === "gardener"
        ? { supervisor: req.user.id }
        : { user: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const total = await Recommendation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        recommendations,
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

// @desc    Get user's personal recommendations and observation feedback
// @route   GET /api/recommendations/my
// @access  Private
router.get("/my", protect, async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;

    // Get traditional recommendations
    const recommendations = await Recommendation.getUserRecommendations(
      req.user.id,
      { status, priority }
    )
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get observations with supervisor feedback
    const userPlants = await UserPlant.find({
      user: req.user.id,
      isActive: true,
      "observations.supervisorFeedback": { $exists: true, $ne: null }
    })
      .populate("plant", "name scientificName images")
      .populate("observations.supervisorFeedback.reviewedBy", "name role profile.gardeningExperience")
      .select("customName observations plant");

    // Extract observations with feedback
    const observationFeedbacks = [];
    userPlants.forEach(userPlant => {
      userPlant.observations.forEach(observation => {
        if (observation.supervisorFeedback && observation.supervisorFeedback.message) {
          observationFeedbacks.push({
            _id: observation._id,
            type: "observation_feedback",
            title: observation.title,
            description: observation.description,
            plantName: userPlant.customName || userPlant.plant.name,
            plantImage: userPlant.plant.images?.[0]?.url,
            observationImages: observation.images,
            feedback: {
              message: observation.supervisorFeedback.message,
              status: observation.supervisorFeedback.status,
              reviewedBy: observation.supervisorFeedback.reviewedBy,
              reviewedAt: observation.supervisorFeedback.reviewedAt
            },
            createdAt: observation.createdAt,
            status: observation.status
          });
        }
      });
    });

    // Combine recommendations and observation feedbacks
    const allRecommendations = [
      ...recommendations.map(rec => ({ ...rec.toObject(), type: "recommendation" })),
      ...observationFeedbacks
    ];

    // Sort by creation date (newest first)
    allRecommendations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const query = { user: req.user.id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const total = await Recommendation.countDocuments(query) + observationFeedbacks.length;

    res.status(200).json({
      success: true,
      data: {
        recommendations: allRecommendations,
        observationFeedbacks: observationFeedbacks.length,
        traditionalRecommendations: recommendations.length,
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

// @desc    Get single recommendation
// @route   GET /api/recommendations/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id)
      .populate("supervisor", "name email profile.gardeningExperience")
      .populate("user", "name email")
      .populate({
        path: "userPlant",
        populate: {
          path: "plant",
          select: "name scientificName category images",
        },
      });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    // Check authorization
    if (
      recommendation.user._id.toString() !== req.user.id &&
      recommendation.supervisor._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Mark as viewed if user is viewing for first time
    if (
      recommendation.user._id.toString() === req.user.id &&
      recommendation.status === "pending"
    ) {
      await recommendation.markAsViewed();
    }

    res.status(200).json({
      success: true,
      data: { recommendation },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create recommendation (Supervisor only)
// @route   POST /api/recommendations
// @access  Private/Supervisor
router.post(
  "/",
  protect,
  authorize("supervisor", "admin"),
  async (req, res, next) => {
    try {
      const {
        userId,
        userPlantId,
        type,
        title,
        description,
        priority,
        dueDate,
        tags,
        supervisorNotes,
      } = req.body;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify user plant exists and belongs to the user
      const userPlant = await UserPlant.findOne({
        _id: userPlantId,
        user: userId,
      });

      if (!userPlant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found in user's collection",
        });
      }

      const recommendation = await Recommendation.create({
        supervisor: req.user.id,
        user: userId,
        userPlant: userPlantId,
        type,
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags,
        supervisorNotes,
      });

      await recommendation.populate([
        { path: "user", select: "name email" },
        {
          path: "userPlant",
          populate: {
            path: "plant",
            select: "name scientificName category",
          },
        },
      ]);

      res.status(201).json({
        success: true,
        message: "Recommendation created successfully",
        data: { recommendation },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update recommendation (Supervisor only)
// @route   PUT /api/recommendations/:id
// @access  Private/Supervisor
router.put(
  "/:id",
  protect,
  authorize("supervisor", "admin"),
  async (req, res, next) => {
    try {
      const recommendation = await Recommendation.findById(req.params.id);

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: "Recommendation not found",
        });
      }

      // Check if supervisor owns this recommendation
      if (
        recommendation.supervisor.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updatedRecommendation = await Recommendation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: "user", select: "name email" },
        {
          path: "userPlant",
          populate: {
            path: "plant",
            select: "name scientificName category",
          },
        },
      ]);

      res.status(200).json({
        success: true,
        message: "Recommendation updated successfully",
        data: { recommendation: updatedRecommendation },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Respond to recommendation (User only)
// @route   PUT /api/recommendations/:id/respond
// @access  Private
router.put("/:id/respond", protect, async (req, res, next) => {
  try {
    const { status, message, notes } = req.body;

    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    // Check if user owns this recommendation
    if (recommendation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await recommendation.updateUserResponse({
      status,
      message,
      notes,
    });

    res.status(200).json({
      success: true,
      message: "Response submitted successfully",
      data: { recommendation },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get users for supervisor to create recommendations
// @route   GET /api/recommendations/users
// @access  Private/Supervisor
router.get(
  "/users",
  protect,
  authorize("supervisor", "admin"),
  async (req, res, next) => {
    try {
      const users = await User.find({
        role: { $in: ["gardener", "homeowner"] },
        isActive: true,
      })
        .select("name email role profile.location")
        .sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get user's plants for supervisor to create recommendations
// @route   GET /api/recommendations/users/:userId/plants
// @access  Private/Supervisor
router.get(
  "/users/:userId/plants",
  protect,
  authorize("supervisor", "admin"),
  async (req, res, next) => {
    try {
      const userPlants = await UserPlant.find({
        user: req.params.userId,
        isActive: true,
      })
        .populate("plant", "name scientificName category images")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: { plants: userPlants },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get recommendation statistics (Supervisor/Admin)
// @route   GET /api/recommendations/stats
// @access  Private/Supervisor/Admin
router.get(
  "/stats",
  protect,
  authorize("supervisor", "gardener", "admin"),
  async (req, res, next) => {
    try {
      const supervisorId =
        req.user.role === "supervisor" || req.user.role === "gardener"
          ? req.user.id
          : undefined;

      const query = supervisorId ? { supervisor: supervisorId } : {};

      const stats = await Recommendation.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            viewed: {
              $sum: { $cond: [{ $eq: ["$status", "viewed"] }, 1, 0] },
            },
            implemented: {
              $sum: { $cond: [{ $eq: ["$status", "implemented"] }, 1, 0] },
            },
            dismissed: {
              $sum: { $cond: [{ $eq: ["$status", "dismissed"] }, 1, 0] },
            },
            urgent: {
              $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
            },
            high: {
              $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
            },
          },
        },
      ]);

      const result = stats[0] || {
        total: 0,
        pending: 0,
        viewed: 0,
        implemented: 0,
        dismissed: 0,
        urgent: 0,
        high: 0,
      };

      res.status(200).json({
        success: true,
        data: { stats: result },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
