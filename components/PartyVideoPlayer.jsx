import React, { forwardRef } from 'react';

const PartyVideoPlayer = forwardRef(({ label = 'User', muted = false }, ref) => {
  return (
    <div className="relative bg-black rounded-lg overflow-hidden w-full aspect-video">
      <video
        ref={ref}
        muted={muted}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
        {label}
      </div>
    </div>
  );
});

PartyVideoPlayer.displayName = 'PartyVideoPlayer';

export default PartyVideoPlayer;
