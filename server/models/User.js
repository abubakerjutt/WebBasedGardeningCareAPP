import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["gardener", "supervisor", "homeowner", "admin"],
      default: "gardener",
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Allow empty/null values
          if (!v || v === "") return true;
          // Validate non-empty phone numbers
          return /^(\+\d{1,3}[-.\s]*)?(\(?\d{2,4}\)?[-.\s]*)?(\d{2,4}[-.\s]*)*\d{4,9}$/.test(
            v
          );
        },
        message: "Please provide a valid phone number",
      },
    },
    avatar: {
      type: String,
      default: null,
    },
    profile: {
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
      climate: {
        type: String,
        enum: [
          "",
          "tropical",
          "subtropical",
          "temperate",
          "continental",
          "polar",
          "arid",
          "semiarid",
        ],
        default: "",
      },
      soilType: {
        type: String,
        enum: ["", "clay", "sandy", "loamy", "silty", "peaty", "chalky"],
        default: "",
      },
      gardeningExperience: {
        type: String,
        enum: ["", "beginner", "intermediate", "advanced", "expert"],
        default: "",
      },
      interests: [
        {
          type: String,
          enum: [
            "vegetables",
            "flowers",
            "fruits",
            "herbs",
            "indoor-plants",
            "outdoor-plants",
            "organic-gardening",
          ],
        },
      ],
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      careReminders: {
        type: Boolean,
        default: true,
      },
      weatherAlerts: {
        type: Boolean,
        default: true,
      },
      communityUpdates: {
        type: Boolean,
        default: true,
      },
      plantRecommendations: {
        type: Boolean,
        default: true,
      },
      // Appearance settings
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
      language: {
        type: String,
        default: "en",
      },
      units: {
        type: String,
        enum: ["metric", "imperial"],
        default: "metric",
      },
      timezone: {
        type: String,
        default: "auto",
      },
      dateFormat: {
        type: String,
        enum: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
        default: "MM/DD/YYYY",
      },
      startOfWeek: {
        type: String,
        enum: ["sunday", "monday"],
        default: "monday",
      },
    },
    // Privacy settings
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true,
      },
      gardenVisible: {
        type: Boolean,
        default: true,
      },
      contactVisible: {
        type: Boolean,
        default: false,
      },
      locationVisible: {
        type: Boolean,
        default: true,
      },
      activityVisible: {
        type: Boolean,
        default: true,
      },
    },
    // Advanced settings
    advanced: {
      autoSync: {
        type: Boolean,
        default: true,
      },
      dataBackup: {
        type: Boolean,
        default: true,
      },
      analytics: {
        type: Boolean,
        default: true,
      },
      betaFeatures: {
        type: Boolean,
        default: false,
      },
      lowPowerMode: {
        type: Boolean,
        default: false,
      },
    },
    notificationSettings: {
      careReminders: {
        enabled: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      weatherAlerts: {
        enabled: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      communityUpdates: {
        enabled: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      plantHealth: {
        enabled: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for search optimization
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "profile.location.city": 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin on successful authentication
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  return user;
};

export default mongoose.model("User", userSchema);
