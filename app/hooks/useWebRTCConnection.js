"use client";
/**
 * useWebRTCConnection.js
 * Purpose: Manage RTCPeerConnections using a single outgoingStream
 * - outgoingStream: the MediaStream that should be sent to every peer (from useWebRTCStream)
 * - signal: { on, off, send } (Ably)
 */

import { useEffect, useRef, useState } from "react";
import {
  createPeerConnection,
  handleRemoteStream,
  addIceCandidate,
} from "@/lib/peerConnectionHelpers";

export function useWebRTCConnection({
  roomId,
  userId,
  outgoingStream, // <-- single stream (webcam or movie+mic)
  signal,
  registerPeerConnection, // function to register pc into useWebRTCStream
}) {
  const peers = useRef({}); // remoteId => { pc, sendersAdded }
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [connectionState, setConnectionState] = useState("idle");

  const on = signal?.on;
  const off = signal?.off;
  const send = signal?.send;

  // safe close
  const closeAll = () => {
    Object.values(peers.current).forEach(({ pc }) => {
      try {
        pc.close();
      } catch (_) {}
    });
    peers.current = {};
    setRemoteStreams([]);
    setConnectionState("disconnected");

    off?.("user-joined");
    off?.("offer");
    off?.("answer");
    off?.("ice");
  };

  // create or get pc, attach outgoingStream tracks
  const getPeer = async (remoteId) => {
    if (peers.current[remoteId]) return peers.current[remoteId].pc;

    const pc = await createPeerConnection((candidate) => {
      if (!candidate || !send) return;
      send("ice", { to: remoteId, from: userId, candidate });
    });

    // attach remote tracks callback
    handleRemoteStream(pc, (stream) => {
      setRemoteStreams((prev) => {
        if (prev.find((s) => s.id === stream.id)) return prev;
        return [...prev, stream];
      });
    });

    // attach outgoingStream's tracks safely (if present)
    if (outgoingStream) {
      try {
        outgoingStream.getTracks().forEach((t) => pc.addTrack(t, outgoingStream));
      } catch (e) {
        console.warn("getPeer addTrack warning:", e);
      }
    }

    // register so useWebRTCStream can replace senders later
    try {
      registerPeerConnection?.(pc);
    } catch (_) {}

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      console.log("🔗 PC state for", remoteId, "=", pc.connectionState);
    };

    // cache
    peers.current[remoteId] = { pc, remoteId };
    return pc;
  };

  // SIGNAL HANDLERS
  const onUserJoined = async ({ userId: other }) => {
    if (!other || other === userId || !send) return;

    console.log("user-joined -> create peer and offer ->", other);
    const pc = await getPeer(other);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send("offer", { to: other, from: userId, sdp: offer.sdp });
    } catch (e) {
      console.warn("onUserJoined offer error:", e);
    }
  };

  const onOffer = async ({ from, to, sdp }) => {
    if (!from || to !== userId) return;

    const pc = await getPeer(from);
    try {
      // set remote and create answer
      await pc.setRemoteDescription({ type: "offer", sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send("answer", { to: from, from: userId, sdp: answer.sdp });
    } catch (e) {
      console.warn("onOffer error:", e);
    }
  };

  const onAnswer = async ({ from, to, sdp }) => {
    if (!from || to !== userId) return;
    const pc = await getPeer(from);
    try {
      await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e) {
      console.warn("onAnswer error:", e);
    }
  };

  const onIce = async ({ from, to, candidate }) => {
    if (!from || to !== userId || !candidate) return;
    const pc = await getPeer(from);
    try {
      await addIceCandidate(pc, candidate);
    } catch (e) {
      console.warn("onIce add candidate error:", e);
    }
  };

  // register listeners & announce
  useEffect(() => {
    if (!roomId || !userId || !on || !send) return;

    setConnectionState("connecting");
    on("user-joined", onUserJoined);
    on("offer", onOffer);
    on("answer", onAnswer);
    on("ice", onIce);

    // announce our presence
    send("user-joined", { userId });

    return () => {
      closeAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, on, send]);

  // when outgoingStream is updated, ensure we replace video sender on each existing pc
  useEffect(() => {
    if (!outgoingStream) return;

    // if outgoingStream has a video track, replace senders
    const newVideoTrack = outgoingStream.getVideoTracks()[0];
    Object.values(peers.current).forEach(({ pc }) => {
      try {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender && newVideoTrack) {
          videoSender.replaceTrack(newVideoTrack);
        } else if (newVideoTrack) {
          // fallback: add as new track
          pc.addTrack(newVideoTrack, outgoingStream);
        }
      } catch (e) {
        console.warn("outgoingStream replace video error:", e);
      }
    });
  }, [outgoingStream]);

  return {
    remoteStreams,
    connectionState,
    closeAll,
  };
}
