import express from "express";
import User from "../models/User.js";
import Plant from "../models/Plant.js";
import UserPlant from "../models/UserPlant.js";
import Garden from "../models/Garden.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require supervisor, gardener, or admin authorization
router.use(authorize("supervisor", "gardener", "admin"));

// @desc    Get supervisor reports
// @route   GET /api/supervisor/reports
// @access  Private (Supervisor/Gardener/Admin only)
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

    // Get user statistics (limited for supervisors)
    const userStats = await User.find(
      {
        createdAt: { $gte: startDate },
        isActive: true,
        role: { $in: ["homeowner", "gardener"] },
      },
      "fullName email role createdAt lastLogin"
    )
      .sort({ createdAt: -1 })
      .limit(20);

    // Get plant statistics
    const plantStats = await Plant.aggregate([
      { $match: { isActive: true, createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ]);

    // Get activity statistics (simplified)
    const activityStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayUsers = await User.countDocuments({
        lastLogin: { $gte: dayStart, $lte: dayEnd },
        role: { $in: ["homeowner", "gardener"] },
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

    const reportData = {
      userStats: userStats.map((user) => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        joinDate: user.createdAt,
        lastActive: user.lastLogin,
      })),
      plantStats,
      activityStats,
    };

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get users for supervisor management
// @route   GET /api/supervisor/users
// @access  Private (Supervisor/Gardener/Admin only)
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {
      isActive: true,
      role: { $in: ["homeowner", "gardener"] },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email role createdAt lastLogin profile.location")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get plant counts for each user
    const usersWithPlantCounts = await Promise.all(
      users.map(async (user) => {
        const plantCount = await UserPlant.countDocuments({
          user: user._id,
          isActive: true,
        });
        return {
          ...user.toObject(),
          plantsCount: plantCount,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users: usersWithPlantCounts,
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

// @desc    Get user observations for supervisor review
// @route   GET /api/supervisor/users/:userId/observations
// @access  Private (Supervisor/Gardener/Admin only)
router.get("/users/:userId/observations", async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.params.userId;

    // Verify user exists and is a regular user
    const user = await User.findOne({
      _id: userId,
      isActive: true,
      role: { $in: ["homeowner", "gardener"] },
    }).select("name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const observations = [];

    // Get observations from UserPlant model
    const userPlantsQuery = {
      user: userId,
      isActive: true,
      "observations.0": { $exists: true },
    };

    if (status) {
      userPlantsQuery["observations.status"] = status;
    }

    const userPlants = await UserPlant.find(userPlantsQuery)
      .populate("plant", "name scientificName category images")
      .populate("observations.supervisorFeedback.reviewedBy", "name role");

    userPlants.forEach((userPlant) => {
      userPlant.observations.forEach((observation) => {
        observations.push({
          _id: observation._id,
          plantId: userPlant._id,
          plantName: userPlant.plant.name,
          plantImage: userPlant.plant.images?.[0],
          title: observation.title,
          description: observation.description,
          images: observation.images,
          status: observation.status,
          createdAt: observation.createdAt,
          supervisorFeedback: observation.supervisorFeedback,
          source: "userPlant",
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });

    // Get observations from Garden model
    const gardenQuery = {
      owner: userId,
      isActive: true,
      "plants.observations.0": { $exists: true },
    };

    const gardens = await Garden.find(gardenQuery)
      .populate("plants.plant", "name scientificName category images")
      .populate(
        "plants.observations.supervisorFeedback.reviewedBy",
        "name role"
      );

    gardens.forEach((garden) => {
      garden.plants.forEach((gardenPlant) => {
        if (gardenPlant.observations && gardenPlant.observations.length > 0) {
          gardenPlant.observations.forEach((observation) => {
            if (!status || observation.status === status) {
              observations.push({
                _id: observation._id,
                plantId: gardenPlant._id,
                gardenId: garden._id,
                plantName:
                  gardenPlant.plant?.name ||
                  gardenPlant.customName ||
                  "Unknown Plant",
                plantImage: gardenPlant.plant?.images?.[0],
                title: observation.title,
                description: observation.description,
                images: observation.images,
                status: observation.status,
                createdAt: observation.createdAt,
                supervisorFeedback: observation.supervisorFeedback,
                source: "garden",
                gardenName: garden.name,
                user: {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                },
              });
            }
          });
        }
      });
    });

    // Sort by creation date (newest first)
    observations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = observations.length;
    const paginatedObservations = observations.slice(
      (page - 1) * limit,
      page * limit
    );

    res.status(200).json({
      success: true,
      data: {
        observations: paginatedObservations,
        user,
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

// @desc    Provide feedback on user observation
// @route   PUT /api/supervisor/observations/:observationId/feedback
// @access  Private (Supervisor/Admin only)
router.put("/observations/:observationId/feedback", async (req, res, next) => {
  try {
    const { message, status } = req.body;
    const observationId = req.params.observationId;

    if (!message || !status) {
      return res.status(400).json({
        success: false,
        message: "Feedback message and status are required",
      });
    }

    // First try to find the observation in UserPlant model
    let userPlant = await UserPlant.findOne({
      "observations._id": observationId,
      isActive: true,
    });

    if (userPlant) {
      // Found in UserPlant model
      const observation = userPlant.observations.id(observationId);
      if (!observation) {
        return res.status(404).json({
          success: false,
          message: "Observation not found",
        });
      }

      observation.supervisorFeedback = {
        message,
        status,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
      observation.status = "reviewed";

      await userPlant.save();

      return res.status(200).json({
        success: true,
        message: "Feedback provided successfully",
        data: {
          observation: {
            _id: observation._id,
            supervisorFeedback: observation.supervisorFeedback,
            status: observation.status,
          },
        },
      });
    }

    // If not found in UserPlant, try Garden model
    const garden = await Garden.findOne({
      "plants.observations._id": observationId,
      isActive: true,
    });

    if (garden) {
      // Found in Garden model
      let observationFound = false;

      for (let plant of garden.plants) {
        if (plant.observations) {
          const observationIndex = plant.observations.findIndex(
            (obs) => obs._id.toString() === observationId
          );

          if (observationIndex !== -1) {
            const observation = plant.observations[observationIndex];

            observation.supervisorFeedback = {
              message,
              status,
              reviewedBy: req.user._id,
              reviewedAt: new Date(),
            };
            observation.status = "reviewed";

            await garden.save();
            observationFound = true;

            return res.status(200).json({
              success: true,
              message: "Feedback provided successfully",
              data: {
                observation: {
                  _id: observation._id,
                  supervisorFeedback: observation.supervisorFeedback,
                  status: observation.status,
                },
              },
            });
          }
        }
      }
    }

    // Observation not found in either model
    return res.status(404).json({
      success: false,
      message: "Observation not found",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get supervisor dashboard statistics
// @route   GET /api/supervisor/dashboard-stats
// @access  Private (Supervisor/Admin only)
router.get("/dashboard-stats", async (req, res, next) => {
  try {
    // Get total active users (homeowners and gardeners)
    const totalUsers = await User.countDocuments({
      isActive: true,
      role: { $in: ["homeowner", "gardener"] },
    });

    // Get total plants in database
    const totalPlants = await Plant.countDocuments({ isActive: true });

    // Get total user plants (plants added by users to gardens and collections)
    const totalUserPlants = await UserPlant.countDocuments({ isActive: true });

    // Get total garden plants
    const gardensWithPlants = await Garden.aggregate([
      { $match: { isActive: true } },
      { $project: { plantCount: { $size: "$plants" } } },
      { $group: { _id: null, total: { $sum: "$plantCount" } } },
    ]);
    const totalGardenPlants = gardensWithPlants[0]?.total || 0;

    // Get total observations from both UserPlant and Garden models
    const userPlantObservationsResult = await UserPlant.aggregate([
      { $match: { isActive: true } },
      { $project: { observationCount: { $size: "$observations" } } },
      { $group: { _id: null, total: { $sum: "$observationCount" } } },
    ]);
    const userPlantObservations = userPlantObservationsResult[0]?.total || 0;

    const gardenObservationsResult = await Garden.aggregate([
      { $match: { isActive: true } },
      { $unwind: { path: "$plants", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          observationCount: {
            $size: { $ifNull: ["$plants.observations", []] },
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$observationCount" } } },
    ]);
    const gardenObservations = gardenObservationsResult[0]?.total || 0;

    const totalObservations = userPlantObservations + gardenObservations;

    // Get pending observations from both sources
    const pendingUserPlantObservations = await UserPlant.countDocuments({
      isActive: true,
      "observations.status": "pending",
    });

    const pendingGardenObservationsResult = await Garden.aggregate([
      { $match: { isActive: true } },
      { $unwind: { path: "$plants", preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: "$plants.observations",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "plants.observations.status": "pending" } },
      { $count: "pendingCount" },
    ]);
    const pendingGardenObservations =
      pendingGardenObservationsResult[0]?.pendingCount || 0;

    const pendingObservations =
      pendingUserPlantObservations + pendingGardenObservations;

    // Get recent activity (plants added to gardens and collections in last 7 days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUserPlants = await UserPlant.countDocuments({
      isActive: true,
      createdAt: { $gte: lastWeek },
    });

    const recentGardenPlants = await Garden.countDocuments({
      isActive: true,
      "plants.plantedDate": { $gte: lastWeek },
    });

    const recentActivity = recentUserPlants + recentGardenPlants;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPlants,
          totalUserPlants: totalUserPlants + totalGardenPlants,
          totalObservations,
          pendingObservations,
          recentActivity,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get recent observations for notifications
// @route   GET /api/supervisor/recent-observations
// @access  Private (Supervisor/Admin only)
router.get("/recent-observations", async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const recentObservations = [];

    // Get recent observations from UserPlant model
    const userPlantsWithRecentObservations = await UserPlant.find({
      isActive: true,
      "observations.0": { $exists: true },
    })
      .populate("user", "name email")
      .populate("plant", "name scientificName")
      .sort({ "observations.createdAt": -1 })
      .limit(parseInt(limit));

    userPlantsWithRecentObservations.forEach((userPlant) => {
      const sortedObservations = userPlant.observations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

      sortedObservations.forEach((observation) => {
        recentObservations.push({
          _id: observation._id,
          plantId: userPlant._id,
          plantName: userPlant.plant.name,
          user: {
            _id: userPlant.user._id,
            name: userPlant.user.name,
            email: userPlant.user.email,
          },
          title: observation.title,
          description: observation.description,
          status: observation.status,
          createdAt: observation.createdAt,
          hasResponse: !!(
            observation.supervisorFeedback &&
            (observation.supervisorFeedback.message ||
              observation.supervisorFeedback.reviewedBy)
          ),
          source: "userPlant",
        });
      });
    });

    // Get recent observations from Garden model
    const gardensWithRecentObservations = await Garden.find({
      isActive: true,
      "plants.observations.0": { $exists: true },
    })
      .populate("owner", "name email")
      .populate("plants.plant", "name scientificName")
      .sort({ "plants.observations.createdAt": -1 })
      .limit(parseInt(limit));

    gardensWithRecentObservations.forEach((garden) => {
      garden.plants.forEach((gardenPlant) => {
        if (gardenPlant.observations && gardenPlant.observations.length > 0) {
          const sortedObservations = gardenPlant.observations
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 2);

          sortedObservations.forEach((observation) => {
            recentObservations.push({
              _id: observation._id,
              plantId: gardenPlant._id,
              gardenId: garden._id,
              plantName:
                gardenPlant.plant?.name ||
                gardenPlant.customName ||
                "Unknown Plant",
              user: {
                _id: garden.owner._id,
                name: garden.owner.name,
                email: garden.owner.email,
              },
              title: observation.title,
              description: observation.description,
              status: observation.status,
              createdAt: observation.createdAt,
              hasResponse: !!(
                observation.supervisorFeedback &&
                (observation.supervisorFeedback.message ||
                  observation.supervisorFeedback.reviewedBy)
              ),
              source: "garden",
              gardenName: garden.name,
            });
          });
        }
      });
    });

    // Sort all observations by creation date
    recentObservations.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      data: {
        observations: recentObservations.slice(0, parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete user observation
// @route   DELETE /api/supervisor/observations/:observationId
// @access  Private (Supervisor/Admin only)
router.delete("/observations/:observationId", async (req, res, next) => {
  try {
    const observationId = req.params.observationId;

    // First try to find and delete the observation in UserPlant model
    let userPlant = await UserPlant.findOne({
      "observations._id": observationId,
      isActive: true,
    });

    if (userPlant) {
      // Found in UserPlant model - remove the observation
      userPlant.observations.id(observationId).remove();
      await userPlant.save();

      return res.status(200).json({
        success: true,
        message: "Observation deleted successfully",
      });
    }

    // If not found in UserPlant, try Garden model
    const garden = await Garden.findOne({
      "plants.observations._id": observationId,
      isActive: true,
    });

    if (garden) {
      // Found in Garden model - remove the observation
      let observationRemoved = false;

      for (let plant of garden.plants) {
        if (plant.observations) {
          const observationIndex = plant.observations.findIndex(
            (obs) => obs._id.toString() === observationId
          );

          if (observationIndex !== -1) {
            plant.observations.splice(observationIndex, 1);
            await garden.save();
            observationRemoved = true;
            break;
          }
        }
      }

      if (observationRemoved) {
        return res.status(200).json({
          success: true,
          message: "Observation deleted successfully",
        });
      }
    }

    // Observation not found in either model
    return res.status(404).json({
      success: false,
      message: "Observation not found",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
