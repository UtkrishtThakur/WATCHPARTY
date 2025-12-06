import React, { useRef, useEffect } from 'react';
import PartyVideoPlayer from '../PartyVideoPlayer';
import PartyControls from '../PartyControls';
import ParticipantsBar from '../ParticipantsBar';

export default function CallWindow({
  localStream,
  remoteStreams = [],
  participants = [],
  onMicToggle,
  onCamToggle,
  onLeave,
  isMicOn = true,
  isCamOn = true,
  isLoading = false,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, index) => {
      if (remoteVideoRefs.current[index]) {
        remoteVideoRefs.current[index].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Main video area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Remote videos */}
        <div className="flex-1 flex flex-wrap gap-4 content-start overflow-auto">
          {remoteStreams.length > 0 ? (
            remoteStreams.map((stream, index) => (
              <div key={index} className="w-full lg:w-1/2 aspect-video">
                <PartyVideoPlayer
                  ref={(el) => {
                    remoteVideoRefs.current[index] = el;
                  }}
                  label={participants[index]?.name || `User ${index + 1}`}
                />
              </div>
            ))
          ) : (
            <div className="w-full flex items-center justify-center text-gray-400">
              Waiting for participants...
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
          {/* Local video */}
          <div className="aspect-video">
            <PartyVideoPlayer
              ref={localVideoRef}
              label="You"
              muted={true}
            />
          </div>

          {/* Participants list */}
          <ParticipantsBar participants={participants} />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-700 p-4">
        <PartyControls
          onMicToggle={onMicToggle}
          onCamToggle={onCamToggle}
          onLeave={onLeave}
          isMicOn={isMicOn}
          isCamOn={isCamOn}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
