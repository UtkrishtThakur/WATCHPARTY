/**
 * File: app/api/auth/verify/route.js
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, code, name } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    // Find OTP
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return NextResponse.json(
        { error: "No OTP request found for this email" },
        { status: 404 }
      );
    }

    // Expired?
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Wrong code?
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 401 }
      );
    }

    // Create or update user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: otpRecord.name || name || "Anonymous",
        email,
        password: otpRecord.password,
        isVerified: true,
      });
    } else {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          password: otpRecord.password,
          isVerified: true,
        },
        { new: true }
      );
    }

    await Otp.deleteOne({ email });

    // Generate JWT with user.id instead of _id
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Normalize user object
    const { password: _, _id, ...rest } = user.toObject();

    const userClean = {
      id: _id.toString(),
      ...rest,
    };

    return NextResponse.json(
      {
        message: "OTP verified successfully!",
        token,
        user: userClean, // 💥 FIXED: frontend now gets user.id
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("OTP verification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
