import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: [
        "care_reminder",
        "watering_reminder",
        "fertilizing_reminder",
        "pruning_reminder",
        "weather_alert",
        "plant_health_alert",
        "community_post",
        "comment_reply",
        "like_received",
        "follow_request",
        "garden_shared",
        "plant_identified",
        "system_update",
        "welcome",
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedModel: {
      type: String,
      enum: ["Plant", "Garden", "Post", "User", "Article"],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    scheduledFor: Date,
    sentAt: Date,
    deliveryMethod: {
      type: [String],
      enum: ["in-app", "email", "push", "sms"],
      default: ["in-app"],
    },
    deliveryStatus: {
      inApp: {
        type: String,
        enum: ["pending", "delivered", "failed"],
        default: "pending",
      },
      email: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
      },
      push: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
      },
      sms: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
      },
    },
    actionUrl: String,
    actionText: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, isDeleted: 1 });
notificationSchema.index({ type: 1, scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Soft delete
notificationSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export default mongoose.model("Notification", notificationSchema);
