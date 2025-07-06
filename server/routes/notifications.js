import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, isRead, priority } = req.query;

    const filters = {
      recipient: req.user.id,
      isDeleted: false,
    };

    if (type) filters.type = type;
    if (isRead !== undefined) filters.isRead = isRead === "true";
    if (priority) filters.priority = priority;

    const notifications = await Notification.find(filters)
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filters);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete("/:id", async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.softDelete();

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create notification (Internal use)
// @route   POST /api/notifications
// @access  Private
router.post("/", async (req, res, next) => {
  try {
    const {
      recipient,
      type,
      title,
      message,
      data = {},
      priority = "medium",
      deliveryMethod = ["in-app"],
      scheduledFor,
      actionUrl,
      actionText,
    } = req.body;

    const notification = await Notification.create({
      recipient,
      sender: req.user.id,
      type,
      title,
      message,
      data,
      priority,
      deliveryMethod,
      scheduledFor,
      actionUrl,
      actionText,
    });

    // Send email if specified
    if (deliveryMethod.includes("email")) {
      try {
        // const User = require("../models/User"); // Already imported at top
        const recipientUser = await User.findById(recipient);

        if (recipientUser && recipientUser.email) {
          await sendEmail({
            to: recipientUser.email,
            subject: title,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${title}</h2>
                <p>${message}</p>
                ${
                  actionUrl
                    ? `<a href="${actionUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${
                        actionText || "View Details"
                      }</a>`
                    : ""
                }
              </div>
            `,
          });

          notification.deliveryStatus.email = "sent";
          await notification.save();
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        notification.deliveryStatus.email = "failed";
        await notification.save();
      }
    }

    res.status(201).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
router.get("/settings", async (req, res, next) => {
  try {
    // const User = require("../models/User"); // Already imported at top
    const user = await User.findById(req.user.id).select(
      "notificationSettings"
    );

    res.status(200).json({
      success: true,
      data: { settings: user.notificationSettings || {} },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
router.put("/settings", async (req, res, next) => {
  try {
    // const User = require("../models/User"); // Already imported at top

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationSettings: req.body },
      { new: true, runValidators: true }
    ).select("notificationSettings");

    res.status(200).json({
      success: true,
      data: { settings: user.notificationSettings },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
