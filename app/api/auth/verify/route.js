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

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return NextResponse.json(
        { error: "No OTP request found for this email" },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify OTP code
    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 401 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create or update user
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

    // Delete OTP record after successful verification
    await Otp.deleteOne({ email });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Exclude password from response
    const { password: _, ...userData } = user.toObject();

    return NextResponse.json(
      { message: "OTP verified successfully!", token, user: userData },
      { status: 200 }
    );
  } catch (err) {
    console.error("OTP verification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
