import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import validate from "../utils/validation.js";

const router = express.Router();

// @desc    Test community API endpoint (no auth required)
// @route   GET /api/community/test
// @access  Public
router.get("/test", async (req, res) => {
  try {
    const postCount = await Post.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      message: "Community API test successful",
      data: {
        totalPosts: postCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Community API test error:", error.message);
    res.status(500).json({
      success: false,
      message: "Community API test failed",
      error: error.message,
    });
  }
});

// All routes require authentication
router.use(protect);

// @desc    Get community posts
// @route   GET /api/community/posts
// @access  Private
router.get("/posts", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters = { isActive: true };
    if (category) filters.category = category;
    if (search) {
      filters.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const posts = await Post.find(filters)
      .populate("author", "name avatar role")
      .populate("comments.author", "name avatar")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: {
        posts,
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

// @desc    Create community post
// @route   POST /api/community/posts
// @access  Private
router.post("/posts", upload.array("images", 5), async (req, res, next) => {
  try {
    const { error } = validate.post(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { title, content, category, tags } = req.body;

    const images =
      req.files?.map((file) => ({
        url: file.path,
        alt: file.originalname,
      })) || [];

    const post = await Post.create({
      title,
      content,
      author: req.user.id,
      category,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      images,
    });

    await post.populate("author", "name avatar role");

    res.status(201).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single post
// @route   GET /api/community/posts/:id
// @access  Private
router.get("/posts/:id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name avatar role")
      .populate("comments.author", "name avatar");

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Like/Unlike post
// @route   POST /api/community/posts/:id/like
// @access  Private
router.post("/posts/:id/like", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const existingLike = post.likes.find(
      (like) => like.user.toString() === req.user.id
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        (like) => like.user.toString() !== req.user.id
      );
    } else {
      // Like
      post.likes.push({ user: req.user.id });
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        liked: !existingLike,
        likeCount: post.likes.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add comment to post
// @route   POST /api/community/posts/:id/comments
// @access  Private
router.post("/posts/:id/comments", async (req, res, next) => {
  try {
    const { error } = validate.comment(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      author: req.user.id,
      content: req.body.content,
    };

    post.comments.push(comment);
    await post.save();

    await post.populate("comments.author", "name avatar");

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      data: { comment: newComment },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
