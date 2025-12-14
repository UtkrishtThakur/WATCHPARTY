import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    // `params` may be a Promise in Next.js dynamic route handlers — await it
    const { roomId } = await params;

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

    // Find the room
    const room = await Room.findById(roomId);

    if (!room) { 
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check if the user is the room creator (host)
    if (room.createdBy.toString() !== decoded.id) {
      return NextResponse.json(
        { error: "Only the room host can end the room" },
        { status: 403 }
      );
    }

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    return NextResponse.json(
      { message: "Room ended successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Room deletion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
