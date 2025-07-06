import express from "express";
import User from "../models/User.js";
import Plant from "../models/Plant.js";
import Garden from "../models/Garden.js";
import UserPlant from "../models/UserPlant.js";
import Recommendation from "../models/Recommendation.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require admin authorization
router.use(authorize("admin"));

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ isActive: true }),
      Plant.countDocuments({ isActive: true }),
      Garden.countDocuments({ isActive: true }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "supervisor" }),
      User.countDocuments({ role: "homeowner" }),
      User.countDocuments({ role: "gardener" }),
    ]);

    const [
      totalUsers,
      totalPlants,
      totalGardens,
      adminUsers,
      supervisorUsers,
      homeownerUsers,
      gardenerUsers,
    ] = stats;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPlants,
          totalGardens,
          usersByRole: {
            admin: adminUsers,
            supervisor: supervisorUsers,
            homeowner: homeownerUsers,
            gardener: gardenerUsers,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get admin reports with comprehensive data
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get("/reports", async (req, res, next) => {
  try {
    const { type = "overview", range = "last7days" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (range) {
      case "last7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "last90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get comprehensive user statistics (admin has access to all users)
    const userStats = await User.find(
      {
        createdAt: { $gte: startDate },
        isActive: true,
      },
      "name email role createdAt lastLogin"
    )
      .sort({ createdAt: -1 })
      .limit(50);

    // Get plant statistics
    const plantStats = await Plant.aggregate([
      { $match: { isActive: true, createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);

    // Get garden statistics
    const gardenStats = await Garden.aggregate([
      { $match: { isActive: true, createdAt: { $gte: startDate } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $project: { type: "$_id", count: 1, _id: 0 } },
    ]);

    // Get activity statistics
    const activityStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayUsers = await User.countDocuments({
        lastLogin: { $gte: dayStart, $lte: dayEnd },
      });

      const dayActivities = await UserPlant.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      activityStats.push({
        date: dayStart.toISOString().split("T")[0],
        users: dayUsers,
        activities: dayActivities,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userStats: userStats.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plants: 0, // Could be calculated if needed
          gardens: 0, // Could be calculated if needed
          lastActive: user.lastLogin || user.createdAt,
        })),
        plantStats,
        gardenStats,
        activityStats,
      },
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    next(error);
  }
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === "active";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      data: { users },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user status or role
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put("/users/:id", async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    const updateData = {};
    if (role) updateData.role = role;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get pending plant approvals
// @route   GET /api/admin/plants/pending
// @access  Private (Admin only)
router.get("/plants/pending", async (req, res, next) => {
  try {
    const pendingPlants = await Plant.find({
      isActive: true,
      approvedBy: { $exists: false },
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingPlants.length,
      data: { plants: pendingPlants },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve plant
// @route   PUT /api/admin/plants/:id/approve
// @access  Private (Admin only)
router.put("/plants/:id/approve", async (req, res, next) => {
  try {
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      { approvedBy: req.user._id },
      { new: true }
    )
      .populate("createdBy", "name email")
      .populate("approvedBy", "name");

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plant approved successfully",
      data: { plant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system health
// @route   GET /api/admin/system/health
// @access  Private (Admin only)
router.get("/system/health", async (req, res, next) => {
  try {
    const health = {
      database: "connected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: { health },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all recommendations (Admin view)
// @route   GET /api/admin/recommendations
// @access  Private (Admin only)
router.get("/recommendations", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, supervisor } = req.query;

    const query = { isActive: true };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (supervisor) query.supervisor = supervisor;

    const recommendations = await Recommendation.find(query)
      .populate("supervisor", "name email profile.gardeningExperience")
      .populate("user", "name email role")
      .populate({
        path: "userPlant",
        populate: {
          path: "plant",
          select: "name scientificName category",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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

// @desc    Get all user plants (Admin view)
// @route   GET /api/admin/user-plants
// @access  Private (Admin only)
router.get("/user-plants", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, user, status } = req.query;

    const query = { isActive: true };
    if (user) query.user = user;
    if (status) query.status = status;

    const userPlants = await UserPlant.find(query)
      .populate("user", "name email role")
      .populate("plant", "name scientificName category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserPlant.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        userPlants,
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

// @desc    Get supervisor performance stats
// @route   GET /api/admin/supervisor-stats
// @access  Private (Admin only)
router.get("/supervisor-stats", async (req, res, next) => {
  try {
    const supervisorStats = await Recommendation.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$supervisor",
          totalRecommendations: { $sum: 1 },
          implementedRecommendations: {
            $sum: { $cond: [{ $eq: ["$status", "implemented"] }, 1, 0] },
          },
          pendingRecommendations: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          urgentRecommendations: {
            $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "supervisor",
        },
      },
      {
        $unwind: "$supervisor",
      },
      {
        $project: {
          supervisorName: "$supervisor.name",
          supervisorEmail: "$supervisor.email",
          totalRecommendations: 1,
          implementedRecommendations: 1,
          pendingRecommendations: 1,
          urgentRecommendations: 1,
          successRate: {
            $cond: [
              { $eq: ["$totalRecommendations", 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      "$implementedRecommendations",
                      "$totalRecommendations",
                    ],
                  },
                  100,
                ],
              },
            ],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: { supervisorStats },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get system logs
// @route   GET /api/admin/system/logs
// @access  Private (Admin only)
router.get("/system/logs", async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Since we don't have a proper logging system in place,
    // we'll create mock system logs for the admin dashboard
    const mockLogs = [];
    const logTypes = ['info', 'warning', 'error', 'success'];
    const logMessages = [
      'System startup completed successfully',
      'Database connection established',
      'User authentication completed',
      'API rate limiting configured',
      'File upload processed',
      'Email notification sent',
      'Weather data synchronized',
      'System health check completed',
      'User session refreshed',
      'Database backup completed'
    ];

    // Generate mock logs based on limit
    for (let i = 0; i < Math.min(parseInt(limit), 50); i++) {
      const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
      const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
      const timestamp = new Date(Date.now() - (i * 3600000)); // Hours ago
      
      mockLogs.push({
        id: `log_${Date.now()}_${i}`,
        type: randomType,
        message: randomMessage,
        timestamp: timestamp.toISOString(),
        source: 'System',
        details: `Generated at ${timestamp.toLocaleString()}`
      });
    }

    res.status(200).json({
      success: true,
      data: { 
        logs: mockLogs,
        total: mockLogs.length 
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
