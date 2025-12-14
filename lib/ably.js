// lib/ably.js
import * as Ably from "ably";

// Create a single shared client for the entire app
let client = null;

export function getAblyClient() {
  if (client) return client;

  client = new Ably.Realtime({
    key: process.env.NEXT_PUBLIC_ABLY_KEY, // MUST be in .env
    clientId: Math.random().toString(36).slice(2), // temporary user ID
  });

  return client;
}
