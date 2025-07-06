import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Article content is required"],
    },
    excerpt: {
      type: String,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "plant-care",
        "garden-design",
        "pest-control",
        "soil-health",
        "composting",
        "seasonal-gardening",
        "tools-equipment",
        "beginner-guide",
        "advanced-techniques",
        "troubleshooting",
      ],
    },
    subcategory: String,
    tags: [String],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    readTime: {
      type: Number, // in minutes
      default: 5,
    },
    featuredImage: {
      url: String,
      alt: String,
      caption: String,
    },
    images: [
      {
        url: String,
        alt: String,
        caption: String,
      },
    ],
    videos: [
      {
        url: String,
        title: String,
        description: String,
        duration: Number, // in seconds
      },
    ],
    steps: [
      {
        stepNumber: Number,
        title: String,
        description: String,
        image: {
          url: String,
          alt: String,
        },
        tips: [String],
      },
    ],
    relatedPlants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plant",
      },
    ],
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookmarks: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        bookmarkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: Date,
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
  },
  {
    timestamps: true,
  }
);

// Create slug from title before saving
articleSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }
  next();
});

// Index for search and performance
articleSchema.index({ title: "text", content: "text", tags: "text" });
articleSchema.index({ category: 1, status: 1, publishedAt: -1 });
articleSchema.index({ slug: 1 });
articleSchema.index({ author: 1 });

// Virtual for like count
articleSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for bookmark count
articleSchema.virtual("bookmarkCount").get(function () {
  return this.bookmarks.length;
});

export default mongoose.model("Article", articleSchema);
