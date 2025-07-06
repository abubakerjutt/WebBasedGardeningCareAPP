import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    userPlant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPlant",
      required: [true, "User plant is required"],
    },
    type: {
      type: String,
      enum: ["care", "treatment", "maintenance", "harvesting", "general"],
      required: [true, "Recommendation type is required"],
    },
    title: {
      type: String,
      required: [true, "Recommendation title is required"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Recommendation description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "viewed", "implemented", "dismissed"],
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    tags: [String],
    attachments: [
      {
        type: String, // URLs to images or documents
        description: String,
      },
    ],
    userResponse: {
      message: String,
      status: {
        type: String,
        enum: [
          "will-implement",
          "implemented",
          "not-applicable",
          "need-clarification",
        ],
      },
      responseDate: Date,
      implementationDate: Date,
      notes: String,
    },
    supervisorNotes: {
      type: String,
      maxlength: [1000, "Supervisor notes cannot exceed 1000 characters"],
    },
    followUp: {
      isRequired: {
        type: Boolean,
        default: false,
      },
      date: Date,
      notes: String,
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

// Indexes
recommendationSchema.index({ supervisor: 1 });
recommendationSchema.index({ user: 1 });
recommendationSchema.index({ userPlant: 1 });
recommendationSchema.index({ status: 1 });
recommendationSchema.index({ priority: 1 });
recommendationSchema.index({ dueDate: 1 });
recommendationSchema.index({ createdAt: -1 });

// Virtual for plant details
recommendationSchema.virtual("plantDetails", {
  ref: "Plant",
  localField: "userPlant",
  foreignField: "_id",
  justOne: true,
});

// Method to mark as viewed
recommendationSchema.methods.markAsViewed = function () {
  if (this.status === "pending") {
    this.status = "viewed";
  }
  return this.save();
};

// Method to update user response
recommendationSchema.methods.updateUserResponse = function (responseData) {
  this.userResponse = {
    ...this.userResponse,
    ...responseData,
    responseDate: new Date(),
  };

  if (responseData.status === "implemented") {
    this.status = "implemented";
    this.userResponse.implementationDate = new Date();
  }

  return this.save();
};

// Static method to get supervisor's recommendation history
recommendationSchema.statics.getSupervisorHistory = function (
  supervisorId,
  filters = {}
) {
  const query = { supervisor: supervisorId, isActive: true };

  if (filters.user) query.user = filters.user;
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.type) query.type = filters.type;

  return this.find(query)
    .populate("user", "name email")
    .populate({
      path: "userPlant",
      populate: {
        path: "plant",
        select: "name scientificName category",
      },
    })
    .sort({ createdAt: -1 });
};

// Static method to get user's recommendations
recommendationSchema.statics.getUserRecommendations = function (
  userId,
  filters = {}
) {
  const query = { user: userId, isActive: true };

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.type) query.type = filters.type;

  return this.find(query)
    .populate("supervisor", "name email profile.gardeningExperience")
    .populate({
      path: "userPlant",
      populate: {
        path: "plant",
        select: "name scientificName category",
      },
    })
    .sort({ createdAt: -1 });
};

export default mongoose.model("Recommendation", recommendationSchema);
