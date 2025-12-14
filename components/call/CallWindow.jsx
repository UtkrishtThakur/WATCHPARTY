"use client";
/**
 * CallWindow.jsx
 * - Shows movie large (if present) + webcam grid
 * - Binds video/audio elements to incoming remote streams
 */

import React, { useEffect, useRef, useState } from "react";
import PartyControls from "../PartyControls";
import ParticipantsBar from "../ParticipantsBar";

export default function CallWindow({
  localStream,
  remoteStreams = [],
  participants = [],
  onMicToggle,
  onCamToggle,
  onLeave,
  onEndRoom,
  isHost = false,
  isMicOn = true,
  isCamOn = true,
  isLoading = false,
  endingRoom = false,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  const [movieStream, setMovieStream] = useState(null);
  const [webcams, setWebcams] = useState([]);

  // classify streams
  useEffect(() => {
    const movie = remoteStreams.find((s) => {
      // heuristics: movie often has no audio and a single video track
      const hasAudio = s.getAudioTracks().length > 0;
      return !hasAudio && s.getVideoTracks().length === 1;
    });

    const cams = remoteStreams.filter((s) => s !== movie);
    setMovieStream(movie || null);
    setWebcams(cams);
  }, [remoteStreams]);

  // local preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // bind webcam video elements
  useEffect(() => {
    webcams.forEach((s) => {
      const el = remoteVideoRefs.current[s.id];
      if (el && el.srcObject !== s) el.srcObject = s;
    });

    // cleanup removed refs
    Object.keys(remoteVideoRefs.current).forEach((id) => {
      if (!webcams.find((w) => w.id === id) && (!movieStream || movieStream.id !== id)) {
        delete remoteVideoRefs.current[id];
      }
    });
  }, [webcams, movieStream]);

  // bind audio for webcam streams
  useEffect(() => {
    webcams.forEach((s) => {
      if (s.getAudioTracks().length > 0) {
        const audioEl = document.getElementById(`audio-${s.id}`);
        if (audioEl && audioEl.srcObject !== s) audioEl.srcObject = s;
      }
    });
  }, [webcams]);

  // render movie (large)
  const renderMovie = () => {
    if (!movieStream) return null;
    const id = movieStream.id;
    return (
      <div className="w-full aspect-video bg-black border border-gray-700 rounded-xl overflow-hidden mb-6">
        <video ref={(el) => { if (el) remoteVideoRefs.current[id] = el; }} autoPlay playsInline className="w-full h-full object-contain" />
      </div>
    );
  };

  const renderWebcam = (s) => {
    const id = s.id;
    return (
      <div key={id} className="relative w-full sm:w-1/2 xl:w-1/3 aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
        <video ref={(el) => { if (el) remoteVideoRefs.current[id] = el; }} autoPlay playsInline className="w-full h-full object-cover" />
        <audio id={`audio-${id}`} autoPlay />
      </div>
    );
  };

  return (
    <div className="w-full bg-black text-white flex flex-col border-t border-gray-800">
      {renderMovie()}

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {webcams.length > 0 ? webcams.map((s) => renderWebcam(s)) : (
          <div className="col-span-full text-center text-gray-400 py-10">{isLoading ? "Connecting..." : "Waiting for participants..."}</div>
        )}
      </div>

      <div className="p-4 flex flex-col lg:flex-row gap-6">
        <div className="relative lg:w-64 aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">You</div>
        </div>

        <ParticipantsBar participants={participants} />
      </div>

      <div className="border-t border-gray-700 p-4">
        <PartyControls
          onMicToggle={onMicToggle}
          onCamToggle={onCamToggle}
          onLeave={onLeave}
          onEndRoom={onEndRoom}
          isHost={isHost}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isLoading={isLoading}
          endingRoom={endingRoom}
        />
      </div>
    </div>
  );
}
