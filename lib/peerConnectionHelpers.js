/**
 * lib/peerConnectionHelpers.js
 * Stable helpers: createPeerConnection, handleRemoteStream, addIceCandidate
 */
import { getIceServers } from "./webrtcConfig";

export async function createPeerConnection(onIceCandidate) {
  const iceServers = await getIceServers();
  const pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: "all" });

  pc.onicecandidate = (e) => {
    if (e.candidate && onIceCandidate) onIceCandidate(e.candidate);
  };

  pc.onconnectionstatechange = () => {
    console.log("PeerConnection state:", pc.connectionState);
  };

  return pc;
}

export function handleRemoteStream(pc, onRemoteStream) {
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      onRemoteStream(stream);
    }
  };
}

export async function addIceCandidate(pc, candidate) {
  if (!pc || !candidate) return;
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.warn("addIceCandidate error:", e);
  }
}
