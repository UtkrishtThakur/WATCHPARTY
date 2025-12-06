import { NextResponse } from "next/server";

const rooms = new Map();
const userConnections = new Map();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const userId = searchParams.get("userId");

  if (!roomId || !userId) {
    return new NextResponse("Missing roomId or userId", { status: 400 });
  }

  // Get WebSocket details from request upgrade header
  const upgrade = req.headers.get("upgrade");
  
  if (upgrade !== "websocket") {
    return new NextResponse("Expected WebSocket connection", { status: 400 });
  }

  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId);
  
  console.log(`User ${userId} connecting to room ${roomId}`);
  console.log(`Room size: ${room.size}`);

  return new NextResponse("WebSocket connection initiated", { status: 101 });
}

export function POST(req) {
  return NextResponse.json(
    { error: "Use WebSocket connection instead" },
    { status: 400 }
  );
}
