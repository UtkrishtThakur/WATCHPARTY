/**
 * File: app/api/room/create/route.js
 * Purpose: Create room endpoint - deletes previous active rooms (one-room-per-user), generates code, adds creator as participant
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import User from "@/models/User";
import jwt from "jsonwebtoken";

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

    const { name, maxParticipants } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }

    // Delete any previous active room created by this user (one room per user at a time)
    await Room.deleteMany({
      createdBy: decoded.id,
      isActive: true,
    });

    const room = await Room.create({
      name,
      createdBy: decoded.id,
      participants: [decoded.id],
      maxParticipants: maxParticipants || 10,
    });

    return NextResponse.json(
      { message: "Room created successfully", room },
      { status: 201 }
    );
  } catch (err) {
    console.error("Room creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
