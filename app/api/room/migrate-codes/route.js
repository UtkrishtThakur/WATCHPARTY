/**
 * File: app/api/room/migrate-codes/route.js
 * Purpose: Migration endpoint - adds unique codes to existing rooms that don't have codes (backward compatibility)
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/room/migrate-codes
 * 
 * Internal endpoint to add missing `code` fields to existing rooms.
 * This fixes the issue where rooms created before the code feature was added
 * don't have a code and cannot be joined by code.
 * 
 * Usage: Call this once after deploying the code field to Room model.
 * It will find all rooms without a code and assign them one.
 */
export async function POST(req) {
  try {
    await dbConnect();

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Find all rooms that don't have a code
    const roomsWithoutCode = await Room.find({ code: { $exists: false } });

    console.log(`[MIGRATE] Found ${roomsWithoutCode.length} rooms without a code`);

    // Assign a unique code to each room
    const updates = [];
    for (const room of roomsWithoutCode) {
      let code;
      let codeExists = true;
      
      // Generate unique code (retry if duplicate)
      while (codeExists) {
        code = uuidv4();
        const existing = await Room.findOne({ code });
        codeExists = !!existing;
      }

      updates.push(
        Room.updateOne({ _id: room._id }, { code })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`[MIGRATE] Successfully migrated ${updates.length} rooms with new codes`);
    }

    return NextResponse.json(
      {
        message: "Migration complete",
        migratedCount: updates.length,
        details: `Added codes to ${updates.length} rooms`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
