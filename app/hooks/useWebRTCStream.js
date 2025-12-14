"use client";
/**
 * useWebRTCStream.js
 * Purpose: Manage webcam + outgoingStream (single outgoing stream pattern).
 * - localCamStream: preview (webcam)
 * - outgoingStream: the MediaStream that should be sent into each RTCPeerConnection
 * - injectMovieStream(movieStream): replace outgoing video track with movie track
 * - attach/detach PCs are handled by useWebRTCConnection which adds outgoingStream to pc
 */

import { useCallback, useRef, useState } from "react";

export function useWebRTCStream() {
  const [localCamStream, setLocalCamStream] = useState(null);
  const [outgoingStream, setOutgoingStream] = useState(null);
  const [error, setError] = useState(null);

  // keep a set of peer connections if you want to operate on them directly
  // (we don't strictly rely on this, but it's useful if you prefer)
  const pcsRef = useRef(new Set());

  const startStream = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: true,
      });

      // preview for local UI
      setLocalCamStream(media);

      // initial outgoingStream: webcam video + mic audio
      const outgoing = new MediaStream();
      media.getVideoTracks().forEach((t) => outgoing.addTrack(t));
      media.getAudioTracks().forEach((t) => outgoing.addTrack(t));

      setOutgoingStream(outgoing);
      setError(null);
    } catch (e) {
      console.error("useWebRTCStream - getUserMedia error:", e);
      setError("Camera or microphone access failed");
    }
  }, []);

  const stopStream = useCallback(() => {
    try {
      localCamStream?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    try {
      outgoingStream?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    setLocalCamStream(null);
    setOutgoingStream(null);
  }, [localCamStream, outgoingStream]);

  // called by RoomPage when it creates a PeerConnection
  const registerPeerConnection = useCallback((pc) => {
    if (!pc) return;
    pcsRef.current.add(pc);

    // add current outgoing tracks to this pc
    if (outgoingStream) {
      outgoingStream.getTracks().forEach((t) => {
        try {
          pc.addTrack(t, outgoingStream);
        } catch (e) {
          // ignore, may cause negotiationneeded which is fine
        }
      });
    }

    // return a detach function
    return () => {
      pcsRef.current.delete(pc);
    };
  }, [outgoingStream]);

  // replace outgoing video with movie video track (host action)
  const injectMovieStream = useCallback((movieStream) => {
    if (!movieStream) return;

    // find movie video track
    const movieVideoTrack = movieStream.getVideoTracks()[0];
    if (!movieVideoTrack) return;

    // new outgoing stream should be: movie video + microphone audio (from localCamStream)
    const newOutgoing = new MediaStream();

    // add movie video
    newOutgoing.addTrack(movieVideoTrack);

    // add mic audio from localCamStream if available
    localCamStream?.getAudioTracks().forEach((a) => {
      newOutgoing.addTrack(a);
    });

    // swap outgoingStream in state
    setOutgoingStream((prev) => {
      // stop old outgoing video tracks (not audio mic)
      try {
        prev?.getVideoTracks().forEach((t) => {
          // do not stop microphone
          t.stop?.();
        });
      } catch (_) {}

      return newOutgoing;
    });

    // Replace video sender track on every registered pc
    pcsRef.current.forEach((pc) => {
      try {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(movieVideoTrack);
        } else {
          // if no sender, add the movie track
          try {
            pc.addTrack(movieVideoTrack, movieStream);
          } catch (e) {
            console.warn("injectMovieStream addTrack failed:", e);
          }
        }
      } catch (e) {
        console.warn("injectMovieStream sender replace failed:", e);
      }
    });

    console.log("🎬 useWebRTCStream: injected movie track and updated outgoingStream");
  }, [localCamStream]);

  // toggle mic in both local preview and outgoing stream
  const toggleAudio = useCallback(() => {
    localCamStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    outgoingStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }, [localCamStream, outgoingStream]);

  // toggle preview video only (webcam preview)
  const toggleVideo = useCallback(() => {
    localCamStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    // outgoing video track will remain whatever it's set to (movie or webcam)
  }, [localCamStream]);

  return {
    // streams
    localCamStream,
    outgoingStream,
    error,

    // lifecycle
    startStream,
    stopStream,

    // peer wiring
    registerPeerConnection,

    // mixing
    injectMovieStream,

    // controls
    toggleAudio,
    toggleVideo,
  };
}
