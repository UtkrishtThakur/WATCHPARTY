import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { roomId } = params;

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
