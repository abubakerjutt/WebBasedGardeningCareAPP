import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plant name is required"],
      trim: true,
      maxlength: [100, "Plant name cannot exceed 100 characters"],
    },
    scientificName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Plant category is required"],
      enum: [
        "flower",
        "vegetable",
        "fruit",
        "herb",
        "tree",
        "shrub",
        "succulent",
      ],
      lowercase: true,
    },
    type: {
      type: String,
      required: [true, "Plant type is required"],
      enum: ["annual", "perennial", "biennial"],
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Plant description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    characteristics: {
      height: {
        min: Number, // in cm
        max: Number,
      },
      width: {
        min: Number, // in cm
        max: Number,
      },
      flowerColor: [String],
      bloomTime: [String],
      foliageColor: [String],
      sunRequirement: {
        type: String,
        enum: ["full-sun", "partial-sun", "partial-shade", "full-shade"],
        required: true,
      },
      waterNeeds: {
        type: String,
        enum: ["low", "moderate", "high"],
        required: true,
      },
      soilType: [
        {
          type: String,
          enum: ["clay", "sandy", "loamy", "silty", "peaty", "chalky"],
        },
      ],
      soilPH: {
        min: { type: Number, min: 0, max: 14 },
        max: { type: Number, min: 0, max: 14 },
      },
      hardiness: {
        zones: [String], // e.g., ['3a', '4b', '5a']
        temperature: {
          min: Number, // in Celsius
          max: Number,
        },
      },
    },
    careInstructions: {
      watering: {
        frequency: String, // e.g., "2-3 times per week"
        amount: String, // e.g., "1-2 inches per week"
        instructions: String,
      },
      fertilizing: {
        frequency: { type: String },
        type: { type: String },
        instructions: { type: String },
      },
      pruning: {
        frequency: String,
        bestTime: String,
        instructions: String,
      },
      repotting: {
        frequency: String,
        instructions: String,
      },
    },
    growthStages: [
      {
        stage: {
          type: String,
          enum: [
            "seed",
            "germination",
            "seedling",
            "vegetative",
            "flowering",
            "fruiting",
            "dormant",
          ],
        },
        duration: String, // e.g., "2-3 weeks"
        description: String,
        careNotes: String,
      },
    ],
    seasonalCare: {
      spring: String,
      summer: String,
      fall: String,
      winter: String,
    },
    commonProblems: [
      {
        problem: String,
        symptoms: [String],
        causes: [String],
        solutions: [String],
        prevention: String,
      },
    ],
    pests: [
      {
        name: String,
        description: String,
        symptoms: [String],
        treatment: String,
        prevention: String,
      },
    ],
    diseases: [
      {
        name: String,
        description: String,
        symptoms: [String],
        treatment: String,
        prevention: String,
      },
    ],
    companionPlants: [
      {
        plant: { type: mongoose.Schema.Types.ObjectId, ref: "Plant" },
        benefit: String,
      },
    ],
    incompatiblePlants: [
      {
        plant: { type: mongoose.Schema.Types.ObjectId, ref: "Plant" },
        reason: String,
      },
    ],
    harvestInfo: {
      timeToHarvest: String, // e.g., "60-90 days from planting"
      harvestSeason: [String],
      signs: [String], // Signs that the plant is ready to harvest
      method: String,
      storage: String,
    },
    nutritionInfo: {
      nutrients: [
        {
          name: String,
          amount: String,
          unit: String,
        },
      ],
      calories: Number, // per 100g
      benefits: [String],
    },
    tags: [String],
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "difficult"],
      default: "moderate",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search optimization
plantSchema.index({
  name: "text",
  scientificName: "text",
  description: "text",
});
plantSchema.index({ category: 1, type: 1 });
plantSchema.index({ "characteristics.sunRequirement": 1 });
plantSchema.index({ "characteristics.waterNeeds": 1 });
plantSchema.index({ difficulty: 1 });
plantSchema.index({ tags: 1 });
plantSchema.index({ isActive: 1 });

// Virtual for primary image
plantSchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Pre-save middleware to ensure only one primary image
plantSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter((img) => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        img.isPrimary = index === this.images.findIndex((i) => i.isPrimary);
      });
    }
  }
  next();
});

// Static method to search plants
plantSchema.statics.searchPlants = function (query, filters = {}) {
  const searchQuery = { isActive: true };

  // Text search using regex (more compatible than $text search)
  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: "i" } },
      { scientificName: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { tags: { $regex: query, $options: "i" } },
    ];
  }

  // Apply filters
  if (filters.category) searchQuery.category = filters.category;
  if (filters.type) searchQuery.type = filters.type;
  if (filters.difficulty) searchQuery.difficulty = filters.difficulty;
  if (filters.sunRequirement)
    searchQuery["characteristics.sunRequirement"] = filters.sunRequirement;
  if (filters.waterNeeds)
    searchQuery["characteristics.waterNeeds"] = filters.waterNeeds;
  if (filters.tags && filters.tags.length > 0)
    searchQuery.tags = { $in: filters.tags };

  return this.find(searchQuery)
    .populate("createdBy", "name")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 });
};

export default mongoose.model("Plant", plantSchema);
