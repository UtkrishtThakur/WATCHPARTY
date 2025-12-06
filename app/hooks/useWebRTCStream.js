// WebRTC Stream Hook
import { useState, useEffect, useRef } from "react";
import { webRTCConstraints } from "@/lib/webrtcConfig";

export function useWebRTCStream() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const streamRef = useRef(null);

  const startStream = async () => {
    setLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(webRTCConstraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Error getting user media:", err);
      setError(err.message || "Failed to access camera/microphone");
    } finally {
      setLoading(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    stream,
    error,
    loading,
    startStream,
    stopStream,
  };
}
