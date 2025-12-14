/**
 * File: models/Room.js
 * Purpose: Mongoose Room schema - room data (name, code, participants, session info, expiry)
 */
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Unique room code used for joining (short UUID)
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => uuidv4(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxParticipants: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Indicates whether a playback/session has started in this room
    sessionStarted: {
      type: Boolean,
      default: false,
    },
    // Timestamp when the playback/session was started
    sessionStartedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  { timestamps: true }
);

export default mongoose.models.Room || mongoose.model("Room", roomSchema);
