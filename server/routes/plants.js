import express from "express";
import Plant from "../models/Plant.js";
import { authorize, protect } from "../middleware/auth.js";
import validate from "../utils/validation.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// @desc    Get all plants
// @route   GET /api/plants
// @access  Private
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      type,
      difficulty,
      sunRequirement,
      waterNeeds,
      tags,
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (difficulty) filters.difficulty = difficulty;
    if (sunRequirement) filters.sunRequirement = sunRequirement;
    if (waterNeeds) filters.waterNeeds = waterNeeds;
    if (tags) filters.tags = tags.split(",");

    const plants = await Plant.searchPlants(search, filters)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Plant.countDocuments({ isActive: true, ...filters });

    res.status(200).json({
      success: true,
      count: plants.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      data: { plants },
    });
  } catch (error) {
    console.error("Error in plants route:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plants",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// @desc    Get single plant
// @route   GET /api/plants/:id
// @access  Private
router.get("/:id", async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id)
      .populate("createdBy", "name avatar")
      .populate("approvedBy", "name")
      .populate("companionPlants.plant", "name images")
      .populate("incompatiblePlants.plant", "name images");

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { plant },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new plant
// @route   POST /api/plants
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin", "supervisor"),
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      console.log("Request body:", req.body);

      // Parse JSON fields if they're strings
      const plantData = { ...req.body };

      // Parse characteristics
      if (typeof plantData.characteristics === "string") {
        try {
          plantData.characteristics = JSON.parse(plantData.characteristics);
          console.log("Parsed characteristics:", plantData.characteristics);
        } catch (e) {
          console.log("Error parsing characteristics:", e);
          return res.status(400).json({
            success: false,
            message: "Invalid characteristics format",
          });
        }
      }

      // Parse careInstructions
      if (typeof plantData.careInstructions === "string") {
        try {
          plantData.careInstructions = JSON.parse(plantData.careInstructions);

          // Ensure careInstructions subobjects are structured correctly
          if (plantData.careInstructions) {
            // Fix watering if needed
            if (
              plantData.careInstructions.watering &&
              typeof plantData.careInstructions.watering !== "object"
            ) {
              plantData.careInstructions.watering = {
                frequency: plantData.careInstructions.watering,
                instructions: "",
              };
            }

            // Fix fertilizing if needed
            if (
              plantData.careInstructions.fertilizing &&
              typeof plantData.careInstructions.fertilizing !== "object"
            ) {
              plantData.careInstructions.fertilizing = {
                frequency: plantData.careInstructions.fertilizing,
                instructions: "",
              };
            }

            // Fix pruning if needed
            if (
              plantData.careInstructions.pruning &&
              typeof plantData.careInstructions.pruning !== "object"
            ) {
              plantData.careInstructions.pruning = {
                frequency: plantData.careInstructions.pruning,
                instructions: "",
              };
            }
          }
        } catch (e) {
          console.log("Error parsing careInstructions:", e);
          return res.status(400).json({
            success: false,
            message: "Invalid careInstructions format",
          });
        }
      }

      // Parse growthStages
      if (typeof plantData.growthStages === "string") {
        try {
          plantData.growthStages = JSON.parse(plantData.growthStages);
        } catch (e) {
          console.log("Error parsing growthStages:", e);
          return res.status(400).json({
            success: false,
            message: "Invalid growthStages format",
          });
        }
      }

      // Parse tags
      if (typeof plantData.tags === "string") {
        try {
          plantData.tags = JSON.parse(plantData.tags);
        } catch (e) {
          console.log("Error parsing tags:", e);
          return res.status(400).json({
            success: false,
            message: "Invalid tags format",
          });
        }
      }

      // Validate the plant data after parsing
      const { error } = validate.plant(plantData);
      if (error) {
        console.log("Validation error:", error.details);
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
          details: error.details,
        });
      }

      // Add uploaded images
      if (req.files && req.files.length > 0) {
        plantData.images = req.files.map((file, index) => ({
          url: file.path,
          alt: `${plantData.name} image ${index + 1}`,
          isPrimary: index === 0,
        }));
      }

      plantData.createdBy = req.user._id;

      // Auto-approve if user is admin
      if (req.user.role === "admin") {
        plantData.approvedBy = req.user._id;
      }

      console.log("Final plant data:", plantData);

      const plant = await Plant.create(plantData);

      const populatedPlant = await Plant.findById(plant._id)
        .populate("createdBy", "name avatar")
        .populate("approvedBy", "name");

      res.status(201).json({
        success: true,
        message: "Plant created successfully",
        data: { plant: populatedPlant },
      });
    } catch (error) {
      console.error("Plant creation error:", error);
      next(error);
    }
  }
);

// @desc    Update plant
// @route   PUT /api/plants/:id
// @access  Private (Admin/Supervisor or Creator)
router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      let plant = await Plant.findById(req.params.id);

      if (!plant) {
        return res.status(404).json({
          success: false,
          message: "Plant not found",
        });
      }

      // Check if user can update this plant
      if (
        req.user.role !== "admin" &&
        req.user.role !== "supervisor" &&
        req.user.role !== "gardener" &&
        plant.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this plant",
        });
      }

      // Parse JSON fields if they're strings
      const updateData = { ...req.body };

      if (typeof updateData.characteristics === "string") {
        updateData.characteristics = JSON.parse(updateData.characteristics);
      }
      if (typeof updateData.careInstructions === "string") {
        updateData.careInstructions = JSON.parse(updateData.careInstructions);

        // Ensure careInstructions subobjects are structured correctly
        if (updateData.careInstructions) {
          // Fix watering if needed
          if (
            updateData.careInstructions.watering &&
            typeof updateData.careInstructions.watering !== "object"
          ) {
            updateData.careInstructions.watering = {
              frequency: updateData.careInstructions.watering,
              instructions: "",
            };
          }

          // Fix fertilizing if needed
          if (
            updateData.careInstructions.fertilizing &&
            typeof updateData.careInstructions.fertilizing !== "object"
          ) {
            updateData.careInstructions.fertilizing = {
              frequency: updateData.careInstructions.fertilizing,
              instructions: "",
            };
          }

          // Fix pruning if needed
          if (
            updateData.careInstructions.pruning &&
            typeof updateData.careInstructions.pruning !== "object"
          ) {
            updateData.careInstructions.pruning = {
              frequency: updateData.careInstructions.pruning,
              instructions: "",
            };
          }
        }
      }
      if (typeof updateData.growthStages === "string") {
        updateData.growthStages = JSON.parse(updateData.growthStages);
      }
      if (typeof updateData.tags === "string") {
        updateData.tags = JSON.parse(updateData.tags);
      }

      // Handle new images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file, index) => ({
          url: file.path,
          alt: `${updateData.name || plant.name} image ${index + 1}`,
          isPrimary:
            index === 0 && (!plant.images || plant.images.length === 0),
        }));

        updateData.images = [...(plant.images || []), ...newImages];
      }

      plant = await Plant.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("createdBy", "name avatar")
        .populate("approvedBy", "name");

      res.status(200).json({
        success: true,
        message: "Plant updated successfully",
        data: { plant },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Delete plant
// @route   DELETE /api/plants/:id
// @access  Private (Admin only)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({
        success: false,
        message: "Plant not found",
      });
    }

    // Soft delete - set isActive to false
    plant.isActive = false;
    await plant.save();

    res.status(200).json({
      success: true,
      message: "Plant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get plant categories
// @route   GET /api/plants/categories/list
// @access  Private
router.get("/categories/list", async (req, res, next) => {
  try {
    const categories = await Plant.distinct("category", { isActive: true });
    const types = await Plant.distinct("type", { isActive: true });
    const difficulties = await Plant.distinct("difficulty", { isActive: true });
    const sunRequirements = await Plant.distinct(
      "characteristics.sunRequirement",
      { isActive: true }
    );
    const waterNeeds = await Plant.distinct("characteristics.waterNeeds", {
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        categories,
        types,
        difficulties,
        sunRequirements,
        waterNeeds,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get recommended plants
// @route   GET /api/plants/recommendations
// @access  Private
router.get("/recommendations/user", async (req, res, next) => {
  try {
    const user = req.user;
    const { limit = 10 } = req.query;

    const filters = { isActive: true };

    // Filter by user's climate if available
    if (user.profile?.climate) {
      // This is a simplified recommendation - in a real app, you'd have more complex logic
      filters["characteristics.hardiness.zones"] = { $exists: true };
    }

    // Filter by user's interests
    if (user.profile?.interests && user.profile.interests.length > 0) {
      filters.category = { $in: user.profile.interests };
    }

    // Filter by user's experience level
    if (user.profile?.gardeningExperience) {
      const experienceMap = {
        beginner: "easy",
        intermediate: ["easy", "moderate"],
        advanced: ["easy", "moderate", "difficult"],
        expert: ["easy", "moderate", "difficult"],
      };

      const allowedDifficulties =
        experienceMap[user.profile.gardeningExperience];
      if (allowedDifficulties) {
        filters.difficulty = Array.isArray(allowedDifficulties)
          ? { $in: allowedDifficulties }
          : allowedDifficulties;
      }
    }

    const plants = await Plant.find(filters)
      .limit(parseInt(limit))
      .sort({ "ratings.average": -1, createdAt: -1 })
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      count: plants.length,
      data: { plants },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Search plants by image (placeholder for future AI integration)
// @route   POST /api/plants/identify
// @access  Private
router.post("/identify", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // Placeholder for AI plant identification
    // In a real implementation, this would use AI services like Google Vision API
    // or a custom plant identification model

    const mockResults = await Plant.find({ isActive: true })
      .limit(5)
      .sort({ "ratings.average": -1 });

    res.status(200).json({
      success: true,
      message: "Plant identification complete (mock results)",
      data: {
        possibleMatches: mockResults,
        confidence: 0.75, // Mock confidence score
        uploadedImage: req.file.path,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
