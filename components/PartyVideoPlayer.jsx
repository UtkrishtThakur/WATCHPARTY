"use client";
/**
 * PartyVideoPlayer.jsx
 * - host selects file; player fires canplay -> calls onMovieStreamReady()
 * - host controls call onHostPlay/onHostPause/onHostSeek (they broadcast to Ably)
 */

import React, { forwardRef, useEffect, useRef, useState } from "react";

const PartyVideoPlayer = forwardRef(function PartyVideoPlayer(
  { isHost, onMovieStreamReady, onHostPlay, onHostPause, onHostSeek },
  videoRef
) {
  const fileRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const urlRef = useRef(null);
  const captureCalledRef = useRef(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(file);
    captureCalledRef.current = false;
    if (videoRef.current) {
      videoRef.current.src = urlRef.current;
      videoRef.current.load();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoadedMeta = () => {
      setDuration(v.duration || 0);
    };

    const onCanPlay = () => {
      setLoaded(true);
      if (captureCalledRef.current) return;
      captureCalledRef.current = true;

      // inform parent to capture and inject movieStream
      onMovieStreamReady?.();
    };

    const onTime = () => setPosition(v.currentTime || 0);

    v.addEventListener("loadedmetadata", onLoadedMeta);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTime);

    return () => {
      v.removeEventListener("loadedmetadata", onLoadedMeta);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTime);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [videoRef, onMovieStreamReady]);

  const onSeek = (e) => {
    if (!isHost) return;
    const t = Number(e.target.value);
    try {
      if (videoRef.current) videoRef.current.currentTime = t;
    } catch {}
    onHostSeek?.(t);
  };

  return (
    <div className="p-4 bg-black text-white border-b border-gray-800">
      {isHost && !loaded && (
        <div className="flex justify-center mb-4">
          <button onClick={() => fileRef.current?.click()} className="bg-blue-600 px-4 py-2 rounded">
            📂 Select Movie File
          </button>
          <input type="file" accept="video/*" className="hidden" ref={fileRef} onChange={handleFile} />
        </div>
      )}

      <div className="w-full aspect-video bg-black rounded overflow-hidden border border-gray-700">
        <video ref={videoRef} autoPlay playsInline controls={false} className="w-full h-full object-contain" />
      </div>

      {isHost && loaded && (
        <div className="mt-4">
          <div className="flex gap-3 mb-2">
            <button onClick={onHostPlay} className="bg-green-600 px-4 py-2 rounded">▶ Play</button>
            <button onClick={onHostPause} className="bg-yellow-500 px-4 py-2 rounded">⏸ Pause</button>
          </div>
          <input type="range" min={0} max={duration} value={position} step={0.1} onChange={onSeek} className="w-full" />
        </div>
      )}

      {!isHost && loaded && (
        <input type="range" disabled min={0} max={duration} value={position} step={0.1} className="w-full opacity-40 mt-4" />
      )}
    </div>
  );
});

export default PartyVideoPlayer;
