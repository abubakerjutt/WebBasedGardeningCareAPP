import express from "express";
import User from "../models/User.js";
import { ownerOrAdmin, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user avatar
// @route   PUT /api/users/:id/avatar
// @access  Private (Owner or Admin)
router.put(
  "/:id/avatar",
  ownerOrAdmin,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image file",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { avatar: req.file.path },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
router.get("/", authorize("admin"), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = { isActive: true };
    if (role) query.role = role;
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

export default router;
