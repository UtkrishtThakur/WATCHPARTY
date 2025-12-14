/**
 * File: app/api/auth/login/route.js
 * Purpose: User login endpoint - verifies credentials, generates JWT token, returns user info
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Password not set. Please verify OTP first." },
        { status: 401 }
      );
    }

    // Validate password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // REMOVE password
    const { password: _, ...rawUser } = user.toObject();

    // 🔥 FIX: RETURN user.id instead of _id
    const formattedUser = {
      ...rawUser,
      id: rawUser._id, // required for WebRTC, Ably, Movie Sync
    };

    delete formattedUser._id; // prevent confusion

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: formattedUser,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
