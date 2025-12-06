// Helper functions for peer connections and WebRTC

export function createPeerConnection(config, onIceCandidate) {
  const peerConnection = new RTCPeerConnection({
    iceServers: config.iceServers,
  });

  peerConnection.addEventListener("icecandidate", (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  });

  return peerConnection;
}

export async function addStreamToPeerConnection(peerConnection, stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
}

export async function handleRemoteStream(peerConnection, onRemoteStream) {
  peerConnection.addEventListener("track", (event) => {
    if (onRemoteStream) {
      onRemoteStream(event.streams[0]);
    }
  });
}

export async function createAndSendOffer(peerConnection, onOffer) {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);
    if (onOffer) {
      onOffer(offer);
    }
  } catch (error) {
    console.error("Error creating offer:", error);
  }
}

export async function handleReceiveOffer(peerConnection, offer, onAnswer) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    if (onAnswer) {
      onAnswer(answer);
    }
  } catch (error) {
    console.error("Error handling offer:", error);
  }
}

export async function handleReceiveAnswer(peerConnection, answer) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error("Error handling answer:", error);
  }
}

export async function addIceCandidate(peerConnection, candidate) {
  try {
    if (candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
}
