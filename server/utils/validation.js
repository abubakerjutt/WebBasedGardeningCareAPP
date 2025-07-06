import Joi from "joi";

// User validation schemas
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string()
    .pattern(
      /^(\+\d{1,3}[-.\s]*)?(\(?\d{2,4}\)?[-.\s]*)?(\d{2,4}[-.\s]*)*\d{4,9}$/
    )
    .optional()
    .messages({
      "string.pattern.base":
        "Please provide a valid phone number (e.g., +92 300 1234567, (555) 123-4567, +1-555-123-4567)",
    }),
  location: Joi.string().max(200).optional(),
  role: Joi.string()
    .valid("gardener", "supervisor", "homeowner", "admin")
    .optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(0).max(50).allow("").optional(),
  email: Joi.string().email().optional(), // Allow email but ignore it in backend
  phone: Joi.string()
    .pattern(
      /^(\+\d{1,3}[-.\s]*)?(\(?\d{2,4}\)?[-.\s]*)?(\d{2,4}[-.\s]*)*\d{4,9}$/
    )
    .allow("")
    .optional()
    .messages({
      "string.pattern.base":
        "Please provide a valid phone number (e.g., +92 300 1234567, (555) 123-4567, +1-555-123-4567)",
    }),
  profile: Joi.object({
    location: Joi.object({
      address: Joi.string().allow("").optional(),
      city: Joi.string().allow("").optional(),
      state: Joi.string().allow("").optional(),
      zipCode: Joi.string().allow("").optional(),
      coordinates: Joi.object({
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
      }).optional(),
    }).optional(),
    climate: Joi.string()
      .valid(
        "tropical",
        "subtropical",
        "temperate",
        "continental",
        "polar",
        "arid",
        "semiarid",
        ""
      )
      .optional(),
    soilType: Joi.string()
      .valid("clay", "sandy", "loamy", "silty", "peaty", "chalky", "")
      .optional(),
    gardeningExperience: Joi.string()
      .valid("beginner", "intermediate", "advanced", "expert", "")
      .optional(),
    interests: Joi.array().items(Joi.string()).optional(),
    bio: Joi.string().max(500).allow("").optional(),
  }).optional(),
  preferences: Joi.object({
    // Notifications
    emailNotifications: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    careReminders: Joi.boolean().optional(),
    weatherAlerts: Joi.boolean().optional(),
    communityUpdates: Joi.boolean().optional(),
    plantRecommendations: Joi.boolean().optional(),
    // Legacy notification format
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      weather: Joi.boolean().optional(),
      community: Joi.boolean().optional(),
      care: Joi.boolean().optional(),
    }).optional(),
    // Appearance
    theme: Joi.string().valid("light", "dark", "system").optional(),
    language: Joi.string().allow("").optional(),
    units: Joi.string().valid("metric", "imperial").optional(),
    timezone: Joi.string().optional(),
    dateFormat: Joi.string()
      .valid("MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD")
      .optional(),
    startOfWeek: Joi.string().valid("sunday", "monday").optional(),
  }).optional(),
  // Privacy settings
  privacy: Joi.object({
    profileVisible: Joi.boolean().optional(),
    gardenVisible: Joi.boolean().optional(),
    contactVisible: Joi.boolean().optional(),
    locationVisible: Joi.boolean().optional(),
    activityVisible: Joi.boolean().optional(),
  }).optional(),
  // Advanced settings
  advanced: Joi.object({
    autoSync: Joi.boolean().optional(),
    dataBackup: Joi.boolean().optional(),
    analytics: Joi.boolean().optional(),
    betaFeatures: Joi.boolean().optional(),
    lowPowerMode: Joi.boolean().optional(),
  }).optional(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(100).required(),
});

// Plant validation schemas
const plantSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  scientificName: Joi.string().optional(),
  category: Joi.string()
    .valid("flower", "vegetable", "fruit", "herb", "tree", "shrub", "succulent")
    .required(),
  type: Joi.string().valid("annual", "perennial", "biennial").required(),
  description: Joi.string().max(1000).required(),
  characteristics: Joi.object({
    height: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
    }).optional(),
    width: Joi.object({
      min: Joi.number().positive().optional(),
      max: Joi.number().positive().optional(),
    }).optional(),
    flowerColor: Joi.array().items(Joi.string()).optional(),
    bloomTime: Joi.array().items(Joi.string()).optional(),
    foliageColor: Joi.array().items(Joi.string()).optional(),
    sunRequirement: Joi.string()
      .valid("full-sun", "partial-sun", "partial-shade", "full-shade")
      .required(),
    waterNeeds: Joi.string().valid("low", "moderate", "high").required(),
    soilType: Joi.array()
      .items(
        Joi.string().valid("clay", "sandy", "loamy", "silty", "peaty", "chalky")
      )
      .optional(),
    soilPH: Joi.object({
      min: Joi.number().min(0).max(14).optional(),
      max: Joi.number().min(0).max(14).optional(),
    }).optional(),
  }).required(),
  careInstructions: Joi.object({
    watering: Joi.object({
      frequency: Joi.string().optional(),
      amount: Joi.string().optional(),
      instructions: Joi.string().optional(),
    }).optional(),
    fertilizing: Joi.object({
      frequency: Joi.string().optional(),
      type: Joi.string().optional(),
      instructions: Joi.string().optional(),
    }).optional(),
    pruning: Joi.object({
      frequency: Joi.string().optional(),
      bestTime: Joi.string().optional(),
      instructions: Joi.string().optional(),
    }).optional(),
  }).optional(),
  difficulty: Joi.string().valid("easy", "moderate", "difficult").optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Garden validation schemas
const gardenSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string()
    .valid("indoor", "outdoor", "greenhouse", "balcony", "rooftop", "community")
    .required(),
  location: Joi.object({
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    coordinates: Joi.object({
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
    }).optional(),
  }).optional(),
  size: Joi.object({
    length: Joi.number().positive().optional(),
    width: Joi.number().positive().optional(),
    unit: Joi.string().valid("square-meters", "square-feet").optional(),
  }).optional(),
  climate: Joi.string()
    .valid(
      "tropical",
      "subtropical",
      "temperate",
      "continental",
      "polar",
      "arid",
      "semiarid"
    )
    .optional(),
  soilConditions: Joi.object({
    type: Joi.string()
      .valid("clay", "sandy", "loamy", "silty", "peaty", "chalky")
      .optional(),
    ph: Joi.number().min(0).max(14).optional(),
    drainage: Joi.string()
      .valid("poor", "moderate", "good", "excellent")
      .optional(),
    fertility: Joi.string().valid("low", "moderate", "high").optional(),
  }).optional(),
  sunExposure: Joi.string()
    .valid("full-sun", "partial-sun", "partial-shade", "full-shade")
    .required(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPublic: Joi.boolean().optional(),
});

const addPlantToGardenSchema = Joi.object({
  plantId: Joi.string().required(),
  location: Joi.object({
    x: Joi.number().optional(),
    y: Joi.number().optional(),
    section: Joi.string().optional(),
  }).optional(),
  quantity: Joi.number().positive().optional(),
  notes: Joi.string().optional(),
});

const careLogSchema = Joi.object({
  plantId: Joi.string().required(),
  action: Joi.string()
    .valid(
      "watered",
      "fertilized",
      "pruned",
      "repotted",
      "harvested",
      "treated",
      "observed"
    )
    .required(),
  notes: Joi.string().optional(),
});

const reminderSchema = Joi.object({
  plantId: Joi.string().required(),
  type: Joi.string()
    .valid("watering", "fertilizing", "pruning", "harvesting", "custom")
    .required(),
  dueDate: Joi.date().required(),
  message: Joi.string().required(),
});

// Post validation
const post = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().max(200),
    content: Joi.string().required().max(5000),
    category: Joi.string().valid(
      "general",
      "plant-care",
      "garden-design",
      "pest-control",
      "harvest",
      "tools",
      "tips"
    ),
    tags: Joi.string().optional(),
  });

  return schema.validate(data);
};

// Comment validation
const comment = (data) => {
  const schema = Joi.object({
    content: Joi.string().required().max(1000),
  });

  return schema.validate(data);
};

// Group validation
const group = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().max(100),
    description: Joi.string().required().max(500),
    category: Joi.string()
      .required()
      .valid(
        "beginner",
        "advanced",
        "location-based",
        "plant-specific",
        "technique",
        "general"
      ),
    privacy: Joi.string().valid("public", "private", "invite-only"),
    location: Joi.object({
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      coordinates: Joi.object({
        latitude: Joi.number(),
        longitude: Joi.number(),
      }),
    }),
    tags: Joi.array().items(Joi.string()),
    socialLinks: Joi.object({
      facebook: Joi.string().uri(),
      whatsapp: Joi.string(),
      telegram: Joi.string(),
    }),
    rules: Joi.array().items(Joi.string()),
  });

  return schema.validate(data);
};

// Article validation
const article = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().max(200),
    content: Joi.string().required(),
    excerpt: Joi.string().max(300),
    category: Joi.string()
      .required()
      .valid(
        "plant-care",
        "garden-design",
        "pest-control",
        "soil-health",
        "composting",
        "seasonal-gardening",
        "tools-equipment",
        "beginner-guide",
        "advanced-techniques",
        "troubleshooting"
      ),
    subcategory: Joi.string(),
    tags: Joi.string(),
    difficulty: Joi.string().valid("beginner", "intermediate", "advanced"),
    readTime: Joi.number().min(1),
    status: Joi.string().valid("draft", "published", "archived"),
    isFeatured: Joi.boolean(),
    seoTitle: Joi.string().max(60),
    seoDescription: Joi.string().max(160),
    seoKeywords: Joi.string(),
    steps: Joi.string(), // JSON string
    relatedPlants: Joi.array().items(Joi.string()),
    relatedArticles: Joi.array().items(Joi.string()),
  });

  return schema.validate(data);
};

// Care log validation
const careLog = (data) => {
  const schema = Joi.object({
    plantId: Joi.string().required(),
    activityType: Joi.string()
      .required()
      .valid(
        "watering",
        "fertilizing",
        "pruning",
        "harvesting",
        "pest-control",
        "observation",
        "repotting",
        "other"
      ),
    notes: Joi.string().max(1000),
    photos: Joi.array().items(Joi.string()),
  });

  return schema.validate(data);
};

// Reminder validation
const reminder = (data) => {
  const schema = Joi.object({
    plantId: Joi.string().required(),
    type: Joi.string()
      .required()
      .valid(
        "watering",
        "fertilizing",
        "pruning",
        "harvesting",
        "pest-control",
        "repotting",
        "observation"
      ),
    title: Joi.string().required().max(100),
    message: Joi.string().required().max(500),
    frequency: Joi.string().valid("daily", "weekly", "monthly", "custom"),
    startDate: Joi.date().required(),
    endDate: Joi.date(),
  });

  return schema.validate(data);
};

// Export validation functions
export default {
  user: (data) => userSchema.validate(data),
  login: (data) => loginSchema.validate(data),
  updateProfile: (data) => updateProfileSchema.validate(data),
  updatePassword: (data) => updatePasswordSchema.validate(data),
  forgotPassword: (data) => forgotPasswordSchema.validate(data),
  resetPassword: (data) => resetPasswordSchema.validate(data),
  plant: (data) => plantSchema.validate(data),
  garden: (data) => gardenSchema.validate(data),
  addPlantToGarden: (data) => addPlantToGardenSchema.validate(data),
  careLog: (data) => careLogSchema.validate(data),
  reminder: (data) => reminderSchema.validate(data),
  post,
  comment,
  group,
  article,
  careLog,
  reminder,
};
