import dbConnect from "@/lib/db";

// Re-export a connect function that uses the centralized lib/db.js
export async function connectDB() {
  return dbConnect();
}
