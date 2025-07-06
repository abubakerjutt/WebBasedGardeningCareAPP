import mongoose from "mongoose";

const gardenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Garden name is required"],
      trim: true,
      maxlength: [100, "Garden name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      required: [true, "Garden type is required"],
      enum: [
        "indoor",
        "outdoor",
        "greenhouse",
        "balcony",
        "rooftop",
        "community",
      ],
      lowercase: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    size: {
      length: Number,
      width: Number,
      unit: {
        type: String,
        enum: ["square-meters", "square-feet"],
        default: "square-meters",
      },
    },
    climate: {
      type: String,
      enum: [
        "tropical",
        "subtropical",
        "temperate",
        "continental",
        "polar",
        "arid",
        "semiarid",
      ],
    },
    soilConditions: {
      type: {
        type: String,
        enum: ["clay", "sandy", "loamy", "silty", "peaty", "chalky"],
      },
      ph: {
        type: Number,
        min: 0,
        max: 14,
      },
      drainage: {
        type: String,
        enum: ["poor", "moderate", "good", "excellent"],
      },
      fertility: {
        type: String,
        enum: ["low", "moderate", "high"],
      },
    },
    sunExposure: {
      type: String,
      required: [true, "Sun exposure is required"],
      enum: ["full-sun", "partial-sun", "partial-shade", "full-shade"],
    },
    plants: [
      {
        plant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Plant",
          required: true,
        },
        plantedDate: {
          type: Date,
          default: Date.now,
        },
        location: {
          x: Number, // coordinates within the garden
          y: Number,
        },
        notes: String,
        status: {
          type: String,
          enum: ["planted", "growing", "flowering", "harvested", "removed"],
          default: "planted",
        },
        observations: [
          {
            title: {
              type: String,
              required: true,
              trim: true,
              maxlength: [
                200,
                "Observation title cannot exceed 200 characters",
              ],
            },
            description: {
              type: String,
              required: true,
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
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
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
      },
    ],
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["read", "write"],
          default: "read",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
gardenSchema.index({ owner: 1, isActive: 1 });
gardenSchema.index({ "plants.plant": 1 });

export default mongoose.model("Garden", gardenSchema);
