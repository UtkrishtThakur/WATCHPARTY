/**
 * File: app/api/auth/register/route.js
 * Purpose: User registration endpoint - generates OTP, sends email, stores OTP record
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Otp from "@/models/Otp";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check existing OTP not expired
    const existingOtp = await Otp.findOne({ email });
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      return NextResponse.json(
        {
          error:
            "OTP already sent. Please wait before requesting a new one."
        },
        { status: 429 }
      );
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save OTP record with temporary user info
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        name: name || "Anonymous",
        password: hashedPassword,
        code: otp,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    // Send email
    await sendOtpEmail(email, `Your OTP is: ${otp}`);

    return NextResponse.json(
      {
        message: "OTP sent to your email!",
        userTemp: {
          email,
          name: name || "Anonymous",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
