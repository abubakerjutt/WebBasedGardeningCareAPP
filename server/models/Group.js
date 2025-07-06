import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Group description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ["member", "moderator", "admin"],
          default: "member",
        },
      },
    ],
    category: {
      type: String,
      enum: [
        "beginner",
        "advanced",
        "location-based",
        "plant-specific",
        "technique",
        "general",
      ],
      required: true,
    },
    location: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    privacy: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "public",
    },
    tags: [String],
    image: {
      url: String,
      alt: String,
    },
    socialLinks: {
      facebook: String,
      whatsapp: String,
      telegram: String,
    },
    rules: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
groupSchema.index({ name: "text", description: "text", tags: "text" });
groupSchema.index({ category: 1, privacy: 1 });
groupSchema.index({ "location.city": 1, "location.state": 1 });

// Virtual for member count
groupSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

export default mongoose.model("Group", groupSchema);
