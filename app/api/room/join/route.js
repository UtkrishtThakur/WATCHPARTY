/**
 * File: app/api/room/join/route.js
 * Purpose: Join room endpoint - finds room by ID or code, adds participant, starts session if first participant
 */
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";
import User from "@/models/User";

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

    const body = await req.json();
    const { roomId, code } = body;

    if (!roomId && !code) {
      return NextResponse.json(
        { error: "Room ID or code is required" },
        { status: 400 }
      );
    }

    let room;
    if (roomId) {
      room = await Room.findById(roomId);
    } else {
      console.log(`[JOIN] Looking for room with code: ${code}`);
      room = await Room.findOne({ code });
      if (!room) {
        console.log(`[JOIN] No room found with code: ${code}. This may indicate the code doesn't exist or the room was created before code support.`);
      }
    }

    if (!room) {
      return NextResponse.json(
        { error: "Room not found. Check the code or create a new room to generate a code." },
        { status: 404 }
      );
    }

    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json(
        { error: "Room is full" },
        { status: 400 }
      );
    }

    // Normalize comparison since participants are ObjectIds
    const alreadyParticipant = room.participants.some((p) => p.toString() === decoded.id);

    if (!alreadyParticipant) {
      room.participants.push(decoded.id);
      // Start the session when the first person (or a new person) joins
      if (!room.sessionStarted) {
        room.sessionStarted = true;
        room.sessionStartedAt = new Date();
      }
      await room.save();
    }

    const populatedRoom = await room.populate("participants", "name email");

    return NextResponse.json(
      { message: "Joined room successfully", room: populatedRoom },
      { status: 200 }
    );
  } catch (err) {
    console.error("Join room error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
