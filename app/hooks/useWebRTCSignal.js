// WebRTC Signaling Hook
import { useState, useEffect, useRef, useCallback } from "react";

export function useWebRTCSignal(roomId, userId) {
  const [signalingState, setSignalingState] = useState("disconnected");
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socketUrl = `${protocol}//${window.location.host}/api/signaling?roomId=${roomId}&userId=${userId}`;
      
      const socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        console.log("Signaling connected");
        setSignalingState("connected");
        setError(null);
      };

      socket.onerror = (err) => {
        console.error("Signaling error:", err);
        setError("Signaling connection error");
        setSignalingState("error");
      };

      socket.onclose = () => {
        console.log("Signaling disconnected");
        setSignalingState("disconnected");
      };

      socketRef.current = socket;
    } catch (err) {
      console.error("Error connecting to signaling:", err);
      setError(err.message);
      setSignalingState("error");
    }
  }, [roomId, userId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      setSignalingState("disconnected");
    }
  }, []);

  const send = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const onMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          callback(message);
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    signalingState,
    error,
    connect,
    disconnect,
    send,
    onMessage,
  };
}
