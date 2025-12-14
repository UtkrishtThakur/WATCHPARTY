import { NextResponse } from "next/server";
import crypto from "crypto";
import User from "@/models/User";

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
    const secret = process.env.METERED_SECRET_KEY;

    if (!domain || !secret) {
      return NextResponse.json({ error: "TURN env vars missing" }, { status: 500 });
    }

    // username = timestamp (UNIX seconds + 24 hours)
    const expiry = Math.floor(Date.now() / 1000) + 24 * 3600;
    const username = String(expiry);

    // credential = HMAC-SHA1(username, secret)
    const hmac = crypto.createHmac("sha1", secret);
    hmac.update(username);
    const credential = hmac.digest("base64");

    return NextResponse.json({
      iceServers: [
        {
          urls: [
            `stun:${domain}:80`,
            `stun:${domain}:3478`
          ]
        },
        {
          urls: [
            `turn:${domain}:80?transport=udp`,
            `turn:${domain}:80?transport=tcp`,
            `turn:${domain}:443?transport=tcp`,
            `turns:${domain}:443`
          ],
          username,
          credential
        }
      ]
    });

  } catch (err) {
    console.error("TURN generation error:", err);
    return NextResponse.json({ error: "Failed to generate TURN credentials" }, { status: 500 });
  }
}
