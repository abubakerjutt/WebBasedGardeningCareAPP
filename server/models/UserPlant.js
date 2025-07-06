import mongoose from "mongoose";

const userPlantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    plant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: [true, "Plant is required"],
    },
    customName: {
      type: String,
      trim: true,
      maxlength: [100, "Custom name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    plantedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "planted",
        "growing",
        "flowering",
        "harvesting",
        "dormant",
        "dead",
      ],
      default: "planted",
    },
    healthStatus: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "critical"],
      default: "good",
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    customCareInstructions: {
      watering: {
        frequency: String,
        lastWatered: Date,
        nextWatering: Date,
      },
      fertilizing: {
        frequency: String,
        lastFertilized: Date,
        nextFertilizing: Date,
      },
      pruning: {
        frequency: String,
        lastPruned: Date,
        nextPruning: Date,
      },
    },
    images: [
      {
        url: String,
        description: String,
        dateTaken: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reminders: [
      {
        type: {
          type: String,
          enum: ["watering", "fertilizing", "pruning", "harvesting", "custom"],
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: String,
        dueDate: {
          type: Date,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedDate: Date,
        isRecurring: {
          type: Boolean,
          default: false,
        },
        recurringInterval: {
          type: String,
          enum: ["daily", "weekly", "bi-weekly", "monthly", "seasonal"],
        },
      },
    ],
    careHistory: [
      {
        action: {
          type: String,
          enum: [
            "watered",
            "fertilized",
            "pruned",
            "repotted",
            "treated",
            "harvested",
            "other",
          ],
          required: true,
        },
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    observations: [
      {
        title: {
          type: String,
          required: [true, "Observation title is required"],
          trim: true,
          maxlength: [200, "Observation title cannot exceed 200 characters"],
        },
        description: {
          type: String,
          required: [true, "Observation description is required"],
          maxlength: [
            1000,
            "Observation description cannot exceed 1000 characters",
          ],
        },
        images: [
          {
            url: String,
            description: String,
          },
        ],
        status: {
          type: String,
          enum: ["pending", "reviewed", "needs_attention"],
          default: "pending",
        },
        supervisorFeedback: {
          message: String,
          status: {
            type: String,
            enum: ["approved", "needs_improvement", "concern"],
          },
          reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          reviewedAt: Date,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
userPlantSchema.index({ user: 1 });
userPlantSchema.index({ plant: 1 });
userPlantSchema.index({ user: 1, plant: 1 }, { unique: true });
userPlantSchema.index({ "reminders.dueDate": 1 });
userPlantSchema.index({ status: 1 });

// Virtual for plant details
userPlantSchema.virtual("plantDetails", {
  ref: "Plant",
  localField: "plant",
  foreignField: "_id",
  justOne: true,
});

// Method to add reminder
userPlantSchema.methods.addReminder = function (reminderData) {
  this.reminders.push(reminderData);
  return this.save();
};

// Method to complete reminder
userPlantSchema.methods.completeReminder = function (reminderId) {
  const reminder = this.reminders.id(reminderId);
  if (reminder) {
    reminder.isCompleted = true;
    reminder.completedDate = new Date();

    // If recurring, create next reminder
    if (reminder.isRecurring && reminder.recurringInterval) {
      const nextDate = new Date(reminder.dueDate);
      switch (reminder.recurringInterval) {
        case "daily":
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case "weekly":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "bi-weekly":
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "seasonal":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
      }

      this.reminders.push({
        type: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: nextDate,
        isRecurring: true,
        recurringInterval: reminder.recurringInterval,
      });
    }
  }
  return this.save();
};

// Method to add care history
userPlantSchema.methods.addCareHistory = function (action, description, notes) {
  this.careHistory.push({
    action,
    description,
    notes,
    date: new Date(),
  });
  return this.save();
};

// Method to add observation
userPlantSchema.methods.addObservation = function (observationData) {
  this.observations.push(observationData);
  return this.save();
};

// Method to update observation feedback (for supervisors)
userPlantSchema.methods.updateObservationFeedback = function (
  observationId,
  feedback
) {
  const observation = this.observations.id(observationId);
  if (observation) {
    observation.supervisorFeedback = feedback;
    observation.status = "reviewed";
  }
  return this.save();
};

export default mongoose.model("UserPlant", userPlantSchema);
