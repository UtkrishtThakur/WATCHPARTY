/**
 * File: app/hooks/useWebRTCSignal.js
 * Purpose: React hook to manage WebRTC peer discovery and connection negotiation via signaling server
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function useWebRTCSignal(roomId, userId) {
  const [state, setState] = useState("disconnected");
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const listeners = useRef({}); // type → array of callbacks

  // Register event listeners
  const listen = useCallback((type, callback) => {
    if (!listeners.current[type]) listeners.current[type] = [];
    listeners.current[type].push(callback);
  }, []);

  // Internal message dispatcher
  const dispatch = (msg) => {
    const handlers = listeners.current[msg.type];
    if (handlers) handlers.forEach((cb) => cb(msg));
  };

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/api/signaling?roomId=${roomId}&userId=${userId}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🔗 Signaling Connected");
        setState("connected");
        setError(null);
      };

      ws.onerror = (err) => {
        console.error("❌ Signaling error", err);
        setError("WebSocket error");
        setState("error");
      };

      ws.onclose = () => {
        console.log("🔌 Signaling closed");
        setState("disconnected");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          dispatch(msg);
        } catch (err) {
          console.error("Invalid WS message:", event.data);
        }
      };
    } catch (err) {
      console.error("Signaling connect failed:", err);
      setError(err.message);
      setState("error");
    }
  }, [roomId, userId]);

  const send = useCallback((type, payload = {}) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready, cannot send", type);
      return;
    }
    wsRef.current.send(JSON.stringify({ type, ...payload }));
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    setState("disconnected");
  }, []);

  useEffect(() => disconnect, []);

  return {
    state,         // "connected" | "error" | "disconnected"
    error,
    connect,
    disconnect,
    send,
    listen,
  };
}
