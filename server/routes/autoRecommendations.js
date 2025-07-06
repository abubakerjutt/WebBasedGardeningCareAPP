import express from "express";
import AutoRecommendation from "../models/AutoRecommendation.js";
import autoRecommendationService from "../services/autoRecommendationService.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get auto recommendations for user
// @route   GET /api/auto-recommendations
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const { type, status, priority, page = 1, limit = 20 } = req.query;

    const query = {
      user: req.user.id,
      isActive: true,
    };

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Get active recommendations that haven't expired
    if (!status || status === "active") {
      query.scheduledFor = { $lte: new Date() };
      query.expiresAt = { $gt: new Date() };
    }

    const recommendations = await AutoRecommendation.find(query)
      .populate("userPlant", "name plantId")
      .populate("garden", "name")
      .sort({ priority: -1, scheduledFor: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AutoRecommendation.countDocuments(query);

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

// @desc    Get dashboard summary
// @route   GET /api/auto-recommendations/dashboard
// @access  Private
router.get("/dashboard", protect, async (req, res, next) => {
  try {
    const now = new Date();

    const activeRecommendations = await AutoRecommendation.getActiveForUser(
      req.user.id
    );

    const summary = {
      total: activeRecommendations.length,
      byType: {},
      byPriority: {},
      urgent: activeRecommendations.filter((r) => r.priority === "urgent")
        .length,
      expiringSoon: activeRecommendations.filter((r) => r.daysRemaining <= 1)
        .length,
    };

    // Count by type
    activeRecommendations.forEach((rec) => {
      summary.byType[rec.type] = (summary.byType[rec.type] || 0) + 1;
      summary.byPriority[rec.priority] =
        (summary.byPriority[rec.priority] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        recentRecommendations: activeRecommendations.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get auto recommendations by type
// @route   GET /api/auto-recommendations/type/:type
// @access  Private
router.get("/type/:type", protect, async (req, res, next) => {
  try {
    const { type } = req.params;
    const { status = "active" } = req.query;

    const recommendations = await AutoRecommendation.getByType(
      req.user.id,
      type
    );

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single auto recommendation
// @route   GET /api/auto-recommendations/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const recommendation = await AutoRecommendation.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate("userPlant", "name plantId")
      .populate("garden", "name");

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Acknowledge auto recommendation
// @route   PUT /api/auto-recommendations/:id/acknowledge
// @access  Private
router.put("/:id/acknowledge", protect, async (req, res, next) => {
  try {
    const { notes } = req.body;

    const recommendation = await AutoRecommendation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    await recommendation.acknowledge(notes);

    res.status(200).json({
      success: true,
      message: "Recommendation acknowledged",
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Dismiss auto recommendation
// @route   PUT /api/auto-recommendations/:id/dismiss
// @access  Private
router.put("/:id/dismiss", protect, async (req, res, next) => {
  try {
    const { notes } = req.body;

    const recommendation = await AutoRecommendation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    await recommendation.dismiss(notes);

    res.status(200).json({
      success: true,
      message: "Recommendation dismissed",
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Generate auto recommendations manually
// @route   POST /api/auto-recommendations/generate
// @access  Private
router.post("/generate", protect, async (req, res, next) => {
  try {
    await autoRecommendationService.generateAllAutoRecommendations();

    res.status(200).json({
      success: true,
      message: "Auto recommendations generated successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
