import mongoose from "mongoose";
import dns from "dns";
import { promisify } from "util";

// Configure DNS settings
dns.setDefaultResultOrder("ipv4first");

const dnsLookup = promisify(dns.lookup);

/**
 * Connects to MongoDB using official recommended approach
 */
const connectDB = async () => {
  try {
    console.log("🔍 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Using MongoDB Atlas recommended options (without strict mode to avoid APIStrictError)
    const clientOptions = {
      serverApi: {
        version: "1",
        strict: false,
        deprecationErrors: false,
      },
    };

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, clientOptions);

    // Test the connection with a ping
    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`✅ Database: ${mongoose.connection.name}`);

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    if (error.message.includes("querySrv ETIMEOUT")) {
      console.log("\n💡 DNS resolution timeout. Possible solutions:");
      console.log("1. Use a direct connection string instead of SRV format");
      console.log("2. Try a different network connection");
      console.log("3. Use local MongoDB for development");
    }

    if (error.message.includes("IP")) {
      console.log(
        "\n💡 Your IP address may need whitelisting in MongoDB Atlas"
      );
    }

    throw error;
  }
};

// Graceful database disconnection
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("💤 MongoDB connection closed");
  }
};

export { connectDB, disconnectDB };
