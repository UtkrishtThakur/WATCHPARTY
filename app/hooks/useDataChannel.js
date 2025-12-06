// Data Channel Hook
import { useState, useCallback } from "react";

export function useDataChannel(peerConnection) {
  const [dataChannel, setDataChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  const createDataChannel = useCallback(
    (label = "chat") => {
      try {
        const dc = peerConnection.createDataChannel(label);
        setupDataChannel(dc);
        return dc;
      } catch (err) {
        console.error("Error creating data channel:", err);
        setError(err.message);
        return null;
      }
    },
    [peerConnection]
  );

  const setupDataChannel = (dc) => {
    dc.onopen = () => {
      console.log("Data channel opened");
      setDataChannel(dc);
    };

    dc.onclose = () => {
      console.log("Data channel closed");
      setDataChannel(null);
    };

    dc.onerror = (err) => {
      console.error("Data channel error:", err);
      setError(err.message);
    };

    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };
  };

  const sendMessage = useCallback(
    (text) => {
      if (dataChannel && dataChannel.readyState === "open") {
        const message = {
          text,
          timestamp: new Date().toISOString(),
        };
        dataChannel.send(JSON.stringify(message));
        return true;
      }
      return false;
    },
    [dataChannel]
  );

  // Handle incoming data channels
  if (peerConnection && !peerConnection._dataChannelHandlerAdded) {
    peerConnection.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };
    peerConnection._dataChannelHandlerAdded = true;
  }

  return {
    dataChannel,
    messages,
    error,
    createDataChannel,
    sendMessage,
  };
}
