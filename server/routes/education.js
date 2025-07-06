import express from "express";
import Article from "../models/Article.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import validate from "../utils/validation.js";

const router = express.Router();

// @desc    Get all articles
// @route   GET /api/education
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      difficulty,
      search,
      featured,
      sortBy = "publishedAt",
      sortOrder = "desc",
    } = req.query;

    const filters = { status: "published" };
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (featured === "true") filters.isFeatured = true;
    if (search) {
      filters.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const articles = await Article.find(filters)
      .populate("author", "name avatar")
      .select("-content") // Exclude full content for list view
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Article.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: {
        articles,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single article
// @route   GET /api/education/:slug
// @access  Public
router.get("/:slug", async (req, res, next) => {
  try {
    const article = await Article.findOne({
      slug: req.params.slug,
      status: "published",
    })
      .populate("author", "name avatar role")
      .populate("relatedPlants", "name images")
      .populate("relatedArticles", "title slug excerpt featuredImage");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.status(200).json({
      success: true,
      data: { article },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create article (Admin only)
// @route   POST /api/education
// @access  Private (Admin)
router.post(
  "/",
  authorize("admin"),
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const { error } = validate.article(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const images =
        req.files?.map((file) => ({
          url: file.path,
          alt: file.originalname,
        })) || [];

      const articleData = {
        ...req.body,
        author: req.user.id,
        images,
      };

      // Set featured image if provided
      if (req.body.featuredImageIndex && images[req.body.featuredImageIndex]) {
        articleData.featuredImage = images[req.body.featuredImageIndex];
      }

      // Parse steps if provided
      if (req.body.steps) {
        try {
          articleData.steps = JSON.parse(req.body.steps);
        } catch (e) {
          // Keep as is if not valid JSON
        }
      }

      // Parse tags
      if (req.body.tags) {
        articleData.tags = req.body.tags.split(",").map((tag) => tag.trim());
      }

      const article = await Article.create(articleData);
      await article.populate("author", "name avatar");

      res.status(201).json({
        success: true,
        data: { article },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update article (Admin only)
// @route   PUT /api/education/:id
// @access  Private (Admin)
router.put("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const { error } = validate.article(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("author", "name avatar");

    res.status(200).json({
      success: true,
      data: { article: updatedArticle },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete article (Admin only)
// @route   DELETE /api/education/:id
// @access  Private (Admin)
router.delete("/:id", authorize("admin"), async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    await Article.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Like/Unlike article
// @route   POST /api/education/:id/like
// @access  Private
router.post("/:id/like", protect, async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const existingLike = article.likes.find(
      (like) => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      article.likes = article.likes.filter(
        (like) => like.user.toString() !== req.user.id
      );
    } else {
      // Like
      article.likes.push({ user: req.user.id });
    }

    await article.save();

    res.status(200).json({
      success: true,
      data: {
        liked: !existingLike,
        likeCount: article.likes.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Bookmark/Unbookmark article
// @route   POST /api/education/:id/bookmark
// @access  Private
router.post("/:id/bookmark", protect, async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    const existingBookmark = article.bookmarks.find(
      (bookmark) => bookmark.user.toString() === req.user.id
    );

    if (existingBookmark) {
      // Remove bookmark
      article.bookmarks = article.bookmarks.filter(
        (bookmark) => bookmark.user.toString() !== req.user.id
      );
    } else {
      // Add bookmark
      article.bookmarks.push({ user: req.user.id });
    }

    await article.save();

    res.status(200).json({
      success: true,
      data: {
        bookmarked: !existingBookmark,
        bookmarkCount: article.bookmarks.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get categories
// @route   GET /api/education/categories
// @access  Public
router.get("/meta/categories", async (req, res, next) => {
  try {
    const categories = await Article.distinct("category", {
      status: "published",
    });

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
