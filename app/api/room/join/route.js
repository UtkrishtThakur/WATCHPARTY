import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
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
      room = await Room.findOne({ code });
    }

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json(
        { error: "Room is full" },
        { status: 400 }
      );
    }

    if (!room.participants.includes(decoded.id)) {
      room.participants.push(decoded.id);
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
