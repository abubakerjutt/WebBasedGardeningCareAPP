import express from "express";
import Garden from "../models/Garden.js";
import { protect } from "../middleware/auth.js";
import validate from "../utils/validation.js";

const router = express.Router();

// @desc    Get all gardens for the logged-in user
// @route   GET /api/gardens
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const gardens = await Garden.find({
      $or: [{ owner: req.user._id }, { "sharedWith.user": req.user._id }],
      isActive: true,
    })
      .populate("owner", "name email")
      .populate("plants.plant", "name scientificName category images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: gardens.length,
      data: { gardens },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single garden
// @route   GET /api/gardens/:id
// @access  Private
router.get("/:id", protect, async (req, res, next) => {
  try {
    const garden = await Garden.findById(req.params.id)
      .populate("owner", "name email")
      .populate(
        "plants.plant",
        "name scientificName category images characteristics careInstructions"
      )
      .populate("sharedWith.user", "name email");

    if (!garden) {
      return res.status(404).json({
        success: false,
        message: "Garden not found",
      });
    }

    // Check if user has access to this garden
    if (
      garden.owner._id.toString() !== req.user._id.toString() &&
      !garden.sharedWith.some(
        (share) => share.user._id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this garden",
      });
    }

    res.status(200).json({
      success: true,
      data: { garden },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new garden
// @route   POST /api/gardens
// @access  Private
router.post("/", protect, async (req, res, next) => {
  try {
    // Validate the garden data
    const { error } = validate.garden(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const gardenData = {
      ...req.body,
      owner: req.user._id,
    };

    const garden = await Garden.create(gardenData);

    const populatedGarden = await Garden.findById(garden._id).populate(
      "owner",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Garden created successfully",
      data: { garden: populatedGarden },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add plant to garden
// @route   POST /api/gardens/:id/plants
// @access  Private
router.post("/:id/plants", protect, async (req, res, next) => {
  try {
    const garden = await Garden.findById(req.params.id);

    if (!garden) {
      return res.status(404).json({
        success: false,
        message: "Garden not found",
      });
    }

    // Check if user owns the garden or has write permission
    const hasWriteAccess =
      garden.owner.toString() === req.user._id.toString() ||
      garden.sharedWith.some(
        (share) =>
          share.user.toString() === req.user._id.toString() &&
          share.permission === "write"
      );

    if (!hasWriteAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add plants to this garden",
      });
    }

    const { plantId, location, notes } = req.body;

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: "Plant ID is required",
      });
    }

    // Check if plant is already in the garden
    const existingPlant = garden.plants.find(
      (p) => p.plant.toString() === plantId && p.status !== "removed"
    );

    if (existingPlant) {
      return res.status(400).json({
        success: false,
        message: "Plant already exists in this garden",
      });
    }

    garden.plants.push({
      plant: plantId,
      location,
      notes,
      status: "planted",
    });

    await garden.save();

    const updatedGarden = await Garden.findById(garden._id).populate(
      "plants.plant",
      "name scientificName category images"
    );

    res.status(200).json({
      success: true,
      message: "Plant added to garden successfully",
      data: { garden: updatedGarden },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Remove plant from garden
// @route   DELETE /api/gardens/:id/plants/:plantId
// @access  Private
router.delete("/:id/plants/:plantId", protect, async (req, res, next) => {
  try {
    const garden = await Garden.findById(req.params.id);

    if (!garden) {
      return res.status(404).json({
        success: false,
        message: "Garden not found",
      });
    }

    // Check if user owns the garden or has write permission
    const hasWriteAccess =
      garden.owner.toString() === req.user._id.toString() ||
      garden.sharedWith.some(
        (share) =>
          share.user.toString() === req.user._id.toString() &&
          share.permission === "write"
      );

    if (!hasWriteAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove plants from this garden",
      });
    }

    // Find and remove the plant
    const plantIndex = garden.plants.findIndex(
      (p) => p.plant.toString() === req.params.plantId
    );

    if (plantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Plant not found in this garden",
      });
    }

    garden.plants.splice(plantIndex, 1);
    await garden.save();

    res.status(200).json({
      success: true,
      message: "Plant removed from garden successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add observation to garden plant
// @route   POST /api/gardens/:gardenId/plants/:plantIndex/observations
// @access  Private
router.post(
  "/:gardenId/plants/:plantIndex/observations",
  protect,
  async (req, res, next) => {
    try {
      const { title, description, images } = req.body;

      const garden = await Garden.findById(req.params.gardenId);
      if (!garden) {
        return res.status(404).json({
          success: false,
          message: "Garden not found",
        });
      }

      // Check if user owns or has access to this garden
      const hasAccess =
        garden.owner.toString() === req.user._id.toString() ||
        garden.sharedWith?.some(
          (share) => share.user.toString() === req.user._id.toString()
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const plantIndex = parseInt(req.params.plantIndex);
      if (plantIndex < 0 || plantIndex >= garden.plants.length) {
        return res.status(404).json({
          success: false,
          message: "Plant not found in garden",
        });
      }

      const observation = {
        title,
        description,
        images: images || [],
        user: req.user._id,
        status: "pending",
        createdAt: new Date(),
      };

      // Initialize observations array if it doesn't exist
      if (!garden.plants[plantIndex].observations) {
        garden.plants[plantIndex].observations = [];
      }

      garden.plants[plantIndex].observations.push(observation);
      await garden.save();

      res.status(201).json({
        success: true,
        message: "Observation added successfully",
        data: { observation },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get observations for garden plant
// @route   GET /api/gardens/:gardenId/plants/:plantIndex/observations
// @access  Private
router.get(
  "/:gardenId/plants/:plantIndex/observations",
  protect,
  async (req, res, next) => {
    try {
      const garden = await Garden.findById(req.params.gardenId).populate(
        "plants.observations.supervisorFeedback.reviewedBy",
        "name role"
      );

      if (!garden) {
        return res.status(404).json({
          success: false,
          message: "Garden not found",
        });
      }

      // Check if user owns or has access to this garden
      const hasAccess =
        garden.owner.toString() === req.user._id.toString() ||
        garden.sharedWith?.some(
          (share) => share.user.toString() === req.user._id.toString()
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const plantIndex = parseInt(req.params.plantIndex);
      if (plantIndex < 0 || plantIndex >= garden.plants.length) {
        return res.status(404).json({
          success: false,
          message: "Plant not found in garden",
        });
      }

      const observations = garden.plants[plantIndex].observations || [];

      res.status(200).json({
        success: true,
        data: { observations },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update observation feedback (Supervisor only)
// @route   PUT /api/gardens/:gardenId/plants/:plantIndex/observations/:observationId/feedback
// @access  Private (Supervisor/Admin)
router.put(
  "/:gardenId/plants/:plantIndex/observations/:observationId/feedback",
  protect,
  async (req, res, next) => {
    try {
      const { message, status } = req.body;

      // Check if user is supervisor, gardener, or admin
      if (
        req.user.role !== "supervisor" &&
        req.user.role !== "gardener" &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Supervisor or Gardener role required.",
        });
      }

      const garden = await Garden.findById(req.params.gardenId);
      if (!garden) {
        return res.status(404).json({
          success: false,
          message: "Garden not found",
        });
      }

      const plantIndex = parseInt(req.params.plantIndex);
      if (plantIndex < 0 || plantIndex >= garden.plants.length) {
        return res.status(404).json({
          success: false,
          message: "Plant not found in garden",
        });
      }

      const observations = garden.plants[plantIndex].observations || [];
      const observation = observations.find(
        (obs) => obs._id.toString() === req.params.observationId
      );

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

      await garden.save();

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
