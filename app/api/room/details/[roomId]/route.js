/**
 * File: app/api/room/details/[roomId]/route.js
 * Purpose: Get room details endpoint - returns full room data with populated user references and participants
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    // `params` may be a Promise in Next.js dynamic route handlers — await it
    const { roomId } = await params;

    const room = await Room.findById(roomId)
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ room }, { status: 200 });
  } catch (err) {
    console.error("Get room error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
