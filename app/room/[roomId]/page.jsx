"use client";
/**
 * RoomPage (page.jsx)
 * Wires everything:
 * - useWebRTCStream -> start webcam, provide outgoingStream, injectMovieStream()
 * - useAblySignal -> signaling
 * - useWebRTCConnection -> pass outgoingStream + registerPeerConnection
 * - PartyVideoPlayer -> host loads file -> RoomPage captures stream and injects
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CallWindow from "@/components/call/CallWindow";
import LoadingSpinner from "@/components/LoadingSpinner";
import PartyVideoPlayer from "@/components/PartyVideoPlayer";
import { useWebRTCStream } from "@/app/hooks/useWebRTCStream";
import { useWebRTCConnection } from "@/app/hooks/useWebRTCConnection";
import { useAblySignal } from "@/app/hooks/useAblySignal";

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [endingRoom, setEndingRoom] = useState(false);

  const videoRef = useRef(null);

  // Use the unified stream hook
  const {
    localCamStream,
    outgoingStream,
    startStream,
    stopStream,
    injectMovieStream,
    registerPeerConnection,
    toggleAudio,
    toggleVideo,
  } = useWebRTCStream();

  // Load user id
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const json = JSON.parse(raw);
      setCurrentUserId(json._id || json.id);
    } catch {}
  }, []);

  // Ably
  const ably = useAblySignal(roomId, currentUserId);
  const stableSignal = useMemo(() => {
    if (!ably?.on || !ably?.send) return null;
    return { on: ably.on, off: ably.off, send: ably.send };
  }, [ably?.on, ably?.off, ably?.send]);

  // WebRTC connection using outgoingStream
  const { remoteStreams, connectionState, closeAll } = useWebRTCConnection({
    roomId,
    userId: currentUserId,
    outgoingStream, // the single outgoing stream
    signal: stableSignal,
    registerPeerConnection, // allows useWebRTCStream to replace senders
  });

  // init: start webcam and load room
  useEffect(() => {
    startStream();
    loadRoom();
    return () => {
      stopStream();
      closeAll?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRoom() {
    try {
      const res = await fetch(`/api/room/details/${roomId}`);
      const data = await res.json();
      if (res.ok) setRoom(data.room);
      else setError(data.error || "Room not found");
    } catch {
      setError("Failed to load room");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!room || !currentUserId) return;
    setIsHost(room.createdBy?._id === currentUserId);
  }, [room, currentUserId]);

  // Host: called by PartyVideoPlayer when the video element canplay
  const handleMovieLoaded = () => {
    const video = videoRef.current;
    if (!video) return;

    // capture the movie's MediaStream and inject into outgoing
    try {
      const movieStream = video.captureStream?.() || video.mozCaptureStream?.();
      if (movieStream) {
        injectMovieStream(movieStream);
        console.log("🎬 Movie stream injected into outgoing stream");
      } else {
        alert("captureStream() not supported in this browser");
      }
    } catch (e) {
      console.error("captureStream failed:", e);
    }
  };

  // Movie sync via Ably (host broadcasts play/pause/seek)
  const broadcast = (action, time) => {
    ably.send?.("movie-sync", { action, time });
  };

  useEffect(() => {
    if (!ably.connected) return;

    const syncMovie = (data) => {
      const { action, time = 0 } = data || {};
      const v = videoRef.current;
      if (!v) return;
      try {
        v.currentTime = time;
      } catch {}
      if (action === "play") v.play().catch(() => {});
      if (action === "pause") v.pause();
    };

    const replyState = () => {
      const v = videoRef.current;
      if (!isHost || !v) return;
      broadcast(v.paused ? "pause" : "play", v.currentTime);
    };

    ably.on("movie-sync", syncMovie);
    ably.on("movie-sync-request", replyState);

    return () => {
      ably.off("movie-sync", syncMovie);
      ably.off("movie-sync-request", replyState);
    };
  }, [ably.connected, isHost]);

  useEffect(() => {
    if (!isHost && ably.connected) {
      ably.send?.("movie-sync-request", {});
    }
  }, [ably.connected, isHost]);

  // Controls
  const toggleMic = () => {
    toggleAudio();
  };
  const toggleCam = () => {
    toggleVideo();
  };
  const leaveRoom = () => {
    closeAll?.();
    stopStream?.();
    router.push("/room/join");
  };
  const endRoom = async () => {
    if (!confirm("End room for everyone?")) return;
    setEndingRoom(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/room/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        closeAll?.();
        stopStream?.();
        router.push("/room/join");
      } else alert("Failed to end room");
    } catch {
      alert("Failed to end room");
    }
    setEndingRoom(false);
  };

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-3">{error}</h1>
          <button className="bg-blue-600 px-6 py-2 rounded" onClick={() => router.push("/room/join")}>
            Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="bg-black text-white">
      <PartyVideoPlayer
        ref={videoRef}
        isHost={isHost}
        onMovieStreamReady={handleMovieLoaded} // called when host's <video> can play (captureStream ready)
        onHostPlay={() => broadcast("play", videoRef.current?.currentTime ?? 0)}
        onHostPause={() => broadcast("pause", videoRef.current?.currentTime ?? 0)}
        onHostSeek={(t) => broadcast("seek", Number(t))}
      />

      <div className="p-4 flex justify-between">
        <div>
          <h1 className="text-xl font-bold">{room?.name}</h1>
          <p className="text-white/60 text-sm">
            {room?.participants?.length} / {room?.maxParticipants}
          </p>
        </div>

        {isHost && (
          <button className="bg-red-600 px-4 py-2 rounded" onClick={endRoom} disabled={endingRoom}>
            {endingRoom ? "Ending…" : "🛑 End Room"}
          </button>
        )}
      </div>

      <CallWindow
        localStream={localCamStream}
        remoteStreams={remoteStreams}
        participants={room?.participants || []}
        isHost={isHost}
        isMicOn={true}
        isCamOn={true}
        onMicToggle={toggleMic}
        onCamToggle={toggleCam}
        onLeave={leaveRoom}
        onEndRoom={endRoom}
        isLoading={connectionState !== "connected"}
        endingRoom={endingRoom}
      />
    </div>
  );
}
