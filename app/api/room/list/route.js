import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await dbConnect();

    // Get user ID from token (if provided)
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue without user ID
      }
    }

    // Only fetch rooms created by the current user
    const query = userId ? { createdBy: userId, isActive: true } : { isActive: true };
    
    const rooms = await Room.find(query)
      .populate("createdBy", "name email")
      .select("name code createdBy participants maxParticipants createdAt");

    return NextResponse.json({ rooms }, { status: 200 });
  } catch (err) {
    console.error("Get rooms error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
