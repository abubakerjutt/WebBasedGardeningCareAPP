import app from "./app.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./db.js";

// Load environment variables
dotenv.config({ path: "./config.env" });

const PORT = process.env.PORT || 5000;

/**
 * Start the application server
 */
const startServer = async () => {
  try {
    // Try to connect to database first - but don't fail if it doesn't work
    try {
      await connectDB();
      console.log("✅ Database connected successfully");
    } catch (dbError) {
      console.error(
        "⚠️ Database connection failed, but starting server anyway:"
      );
      console.error(dbError.message);
      console.log("🔧 Server will run without database functionality");
    }

    // Start HTTP server regardless of database status
    const server = app.listen(PORT, () => {
      console.log(`🌱 Gardening Care Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Frontend URL: http://localhost:5173`);
      console.log(`🔗 Backend URL: http://localhost:${PORT}`);
    });

    // Setup Socket.io
    setupSocketIO(server);

    // Graceful shutdown
    setupGracefulShutdown(server);

    return server;
  } catch (error) {
    console.error("❌ Failed to start application:", error.message);
    process.exit(1);
  }
};

/**
 * Setup Socket.io for real-time features
 */
const setupSocketIO = (server) => {
  // Socket.io setup for real-time features
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      methods: ["GET", "POST"],
    },
  });

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("👤 User connected:", socket.id);

    // Join user to their personal room for notifications
    socket.on("join-user-room", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Handle garden updates
    socket.on("garden-update", (data) => {
      socket.to(`user-${data.userId}`).emit("garden-updated", data);
    });

    // Handle community messages
    socket.on("community-message", (data) => {
      io.emit("new-community-message", data);
    });

    socket.on("disconnect", () => {
      console.log("👤 User disconnected:", socket.id);
    });
  });

  // Make io available to routes
  app.set("io", io);
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = (server) => {
  process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));
};

const gracefulShutdown = async (server, signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  server.close(async () => {
    await disconnectDB();
    console.log("💤 Process terminated");
    process.exit(0);
  });
};

// Start the server
startServer();
