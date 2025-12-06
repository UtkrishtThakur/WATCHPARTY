// WebSocket Signaling Server Utilities
// This file contains utilities for WebSocket-based signaling in Next.js

export const signalingServer = {
  rooms: new Map(),
  connections: new Map(),

  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    return this.rooms.get(roomId);
  },

  addToRoom(roomId, userId) {
    const room = this.createRoom(roomId);
    room.add(userId);
    return room;
  },

  removeFromRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  },

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room) : [];
  },

  isInRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    return room ? room.has(userId) : false;
  },
};
