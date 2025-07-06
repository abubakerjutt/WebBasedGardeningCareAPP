import mongoose from "mongoose";

const autoRecommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    userPlant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPlant",
      required: false, // Some recommendations might be general
    },
    garden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Garden",
      required: false,
    },
    type: {
      type: String,
      enum: [
        "watering_reminder",
        "weather_alert",
        "fertilizing_reminder",
        "pruning_reminder",
        "harvest_reminder",
        "planting_suggestion",
        "pest_prevention",
        "seasonal_care",
      ],
      required: [true, "Recommendation type is required"],
    },
    title: {
      type: String,
      required: [true, "Recommendation title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Recommendation message is required"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "acknowledged", "dismissed", "expired"],
      default: "active",
    },
    scheduledFor: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    weatherData: {
      temperature: {
        min: Number,
        max: Number,
      },
      condition: String,
      humidity: Number,
      precipitation: Number,
      alerts: [String],
    },
    actionTaken: {
      type: Boolean,
      default: false,
    },
    actionDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    triggerData: {
      // Store data that triggered this recommendation
      lastWateringDate: Date,
      soilMoisture: Number,
      daysSinceLastWatering: Number,
      plantGrowthStage: String,
      weatherForecast: Object,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      interval: {
        type: String,
        enum: ["daily", "weekly", "monthly", "seasonal"],
      },
      frequency: Number, // e.g., every 2 days, every 3 weeks
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
autoRecommendationSchema.index({ user: 1 });
autoRecommendationSchema.index({ userPlant: 1 });
autoRecommendationSchema.index({ type: 1 });
autoRecommendationSchema.index({ status: 1 });
autoRecommendationSchema.index({ scheduledFor: 1 });
autoRecommendationSchema.index({ expiresAt: 1 });
autoRecommendationSchema.index({ priority: 1 });
autoRecommendationSchema.index({ isActive: 1 });

// Compound indexes
autoRecommendationSchema.index({ user: 1, status: 1 });
autoRecommendationSchema.index({ user: 1, scheduledFor: 1 });
autoRecommendationSchema.index({ scheduledFor: 1, isActive: 1 });

// Virtual for days remaining
autoRecommendationSchema.virtual("daysRemaining").get(function () {
  if (!this.expiresAt) return null;
  const now = new Date();
  const timeDiff = this.expiresAt.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for urgency score
autoRecommendationSchema.virtual("urgencyScore").get(function () {
  const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 };
  const daysRemaining = this.daysRemaining || 0;
  const priorityScore = priorityScores[this.priority] || 2;

  // Higher urgency for sooner expiration and higher priority
  return priorityScore * (daysRemaining <= 1 ? 2 : 1);
});

// Static method to get active recommendations for user
autoRecommendationSchema.statics.getActiveForUser = function (
  userId,
  options = {}
) {
  const query = {
    user: userId,
    status: "active",
    isActive: true,
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  };

  if (options.type) query.type = options.type;
  if (options.priority) query.priority = options.priority;

  return this.find(query)
    .populate("userPlant", "name plantId")
    .populate("garden", "name")
    .sort({ priority: -1, scheduledFor: 1 });
};

// Static method to get recommendations by type
autoRecommendationSchema.statics.getByType = function (userId, type) {
  return this.find({
    user: userId,
    type: type,
    status: "active",
    isActive: true,
    scheduledFor: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  })
    .populate("userPlant", "name plantId")
    .populate("garden", "name")
    .sort({ scheduledFor: 1 });
};

// Method to mark as acknowledged
autoRecommendationSchema.methods.acknowledge = function (notes = "") {
  this.status = "acknowledged";
  this.actionTaken = true;
  this.actionDate = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Method to dismiss
autoRecommendationSchema.methods.dismiss = function (notes = "") {
  this.status = "dismissed";
  this.actionDate = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

const AutoRecommendation = mongoose.model(
  "AutoRecommendation",
  autoRecommendationSchema
);

export default AutoRecommendation;
