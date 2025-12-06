// WebRTC Configuration

export const webRTCConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
    // Optional: Add your own TURN server for better connectivity
    // {
    //   urls: ["turn:your-turn-server.com"],
    //   username: "your-username",
    //   credential: "your-password",
    // },
  ],
};

export const webRTCConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export const peerConnectionConfig = {
  iceConnectionState: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    FAILED: "failed",
    CLOSED: "closed",
  },
};
