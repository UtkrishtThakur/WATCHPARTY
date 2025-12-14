"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Ably from "ably";

export function useAblySignal(roomId, userId) {
  const [connected, setConnected] = useState(false);

  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const listeners = useRef({});

  useEffect(() => {
    if (!roomId || !userId) return;

    console.log("🟦 [ABLY] Initializing Ably client...");

    // Prevent creating multiple clients
    if (!clientRef.current) {
      clientRef.current = new Ably.Realtime({
        key: process.env.NEXT_PUBLIC_ABLY_KEY,
        echoMessages: true,
      });
    }

    const client = clientRef.current;

    // 🔵 ABLY CONNECTION DEBUG LOGS
    client.connection.on("connecting", () =>
      console.log("🟡 [ABLY] connecting...")
    );
    client.connection.on("connected", () =>
      console.log("🟢 [ABLY] connected")
    );
    client.connection.on("failed", (err) =>
      console.error("🔴 [ABLY] failed:", err)
    );
    client.connection.on("disconnected", () =>
      console.warn("🟠 [ABLY] disconnected")
    );
    client.connection.on("suspended", () =>
      console.warn("🛑 [ABLY] suspended")
    );

    const setupChannel = async () => {
      console.log(`📡 [ABLY] Attaching to channel room-${roomId} ...`);

      const channel = client.channels.get(`room-${roomId}`);
      channelRef.current = channel;

      try {
        await channel.attach();
        console.log("🟢 [ABLY] Channel attached:", channel.name);
      } catch (e) {
        console.error("🔴 [ABLY] Channel attach failed:", e);
      }

      channel.subscribe((msg) => {
        console.log(
          `📥 [ABLY] MESSAGE RECEIVED event=${msg.name}:`,
          msg.data
        );

        const { name, data } = msg;
        const set = listeners.current[name];
        if (!set) return;
        set.forEach((cb) => cb(data));
      });
    };

    if (client.connection.state === "connected") {
      setConnected(true);
      setupChannel();
    }

    client.connection.on("connected", () => {
      setConnected(true);
      setupChannel();
    });

    return () => {
      console.log("🧹 [ABLY] Cleaning up...");
      try {
        channelRef.current?.unsubscribe();
        clientRef.current?.close();
      } catch (e) {
        console.error("Cleanup error:", e);
      }
      channelRef.current = null;
      clientRef.current = null;
      listeners.current = {};
      setConnected(false);
    };
  }, [roomId, userId]);

  // EVENT SUBSCRIBE
  const on = useCallback((event, cb) => {
    if (!listeners.current[event]) listeners.current[event] = new Set();
    listeners.current[event].add(cb);
    console.log(`👂 [ABLY] Listening for '${event}'`);
  }, []);

  // EVENT UNSUBSCRIBE
  const off = useCallback((event, cb) => {
    if (!listeners.current[event]) return;
    listeners.current[event].delete(cb);
  }, []);

  // EVENT PUBLISH
  const send = useCallback(
    (event, data = {}) => {
      const ch = channelRef.current;
      if (!ch) {
        console.warn("⚠️ [ABLY] Tried to send but channel not ready:", event);
        return;
      }
      console.log("📤 [ABLY] PUBLISH:", event, data);
      ch.publish(event, { ...data, from: userId });
    },
    [userId]
  );

  return { connected, on, off, send };
}
