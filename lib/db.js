import mongoose from "mongoose";

let isConnected = false;

export default async function dbConnect() {
  if (isConnected) {
    return;
  }

  try {
    // Normalize and sanitize MONGO_URI
    const rawUri = process.env.MONGO_URI;
    const mongoUri = rawUri
      ? rawUri.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")
      : rawUri;

    if (!mongoUri || mongoUri.includes("<db_password>")) {
      console.error(
        "❌ MONGO_URI not configured properly. Please update .env.local with your MongoDB Atlas password."
      );
      throw new Error(
        "MongoDB connection string is invalid. Update MONGO_URI in .env.local"
      );
    }

    // Create a masked version for logging (hide password)
    let masked = mongoUri;
    try {
      masked = mongoUri.replace(/(\/\/[^:]+:)([^@]+)(@)/, "$1***$3");
    } catch (e) {
      // ignore masking errors
    }
    console.log(`Attempting MongoDB connect to: ${masked}`);

    await mongoose.connect(mongoUri, {
      dbName: "watchparty",
      // use new URL parser and unified topology are default in modern mongoose
    });

    isConnected = true;
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error && error.message ? error.message : error);

    // Provide actionable hints for common auth issues
    if (error && typeof error.message === 'string' && /bad auth|Authentication failed|auth/i.test(error.message)) {
      console.error("Hint: 'bad auth' usually means the username/password in MONGO_URI is incorrect or needs URL-encoding.");
      console.error(" - Ensure the DB user exists in MongoDB Atlas (Database Access).");
      console.error(" - If your password contains special characters (e.g. @, #, :), URL-encode it.");
      console.error(" - Confirm your IP is whitelisted in Network Access (or use 0.0.0.0/0 for testing).");
    }

    throw error;
  }
}
