import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Configure path for environment variables
dotenv.config({ path: "./config.env" });

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import plantRoutes from "./routes/plants.js";
import gardenRoutes from "./routes/gardens.js";

import careRoutes from "./routes/care.js";
import communityRoutes from "./routes/community.js";
import notificationRoutes from "./routes/notifications.js";
import weatherRoutes from "./routes/weather.js";
import adminRoutes from "./routes/admin.js";
import educationRoutes from "./routes/education.js";
import userPlantRoutes from "./routes/userPlants.js";
import recommendationRoutes from "./routes/recommendations.js";
import autoRecommendationRoutes from "./routes/autoRecommendations.js";
import autoReminderRoutes from "./routes/autoReminders.js";
import supervisorRoutes from "./routes/supervisor.js";

// Import middleware
import errorHandler from "./middleware/errorHandler.js";
import { protect } from "./middleware/auth.js";

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - General API limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500, // Increased from 300 to 500
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/api/health' || req.path.startsWith('/uploads');
  }
});

// More permissive rate limiter for admin routes
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5000, // Very high limit for admin operations (increased from 2000)
  message: "Too many admin requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes except admin
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin')) {
    adminLimiter(req, res, next);
  } else {
    generalLimiter(req, res, next);
  }
});

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// JSON parsing error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    console.error("JSON Parsing Error:", error.message);
    console.error("Request body:", error.body);
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      details: "Please check your request format and try again",
    });
  }
  next(error);
});

// Static files with CORS headers
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for static files
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/plants", plantRoutes); // Plants route has its own protection in the route file
app.use("/api/gardens", gardenRoutes); // Gardens route has its own protection in the route file

app.use("/api/care", careRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/notifications", protect, notificationRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/admin", protect, adminRoutes);
app.use("/api/education", protect, educationRoutes);
app.use("/api/user-plants", userPlantRoutes);
app.use("/api/recommendations", protect, recommendationRoutes);
app.use("/api/auto-recommendations", protect, autoRecommendationRoutes);
app.use("/api/auto-reminders", autoReminderRoutes);
app.use("/api/supervisor", protect, supervisorRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gardening Care API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default app;
