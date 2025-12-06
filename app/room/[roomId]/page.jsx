'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CallWindow from '@/components/call/CallWindow';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useWebRTCStream } from '@/app/hooks/useWebRTCStream';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId;
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [endingRoom, setEndingRoom] = useState(false);

  const { stream: localStream, startStream, stopStream } = useWebRTCStream();

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    loadRoom();
    startStream();

    return () => {
      stopStream();
    };
  }, []);

  const loadRoom = async () => {
    try {
      const res = await fetch(`/api/room/details/${roomId}`);
      const data = await res.json();

      if (res.ok) {
        setRoom(data.room);
        // Log for debugging
        console.log('Room data:', data.room);
        console.log('createdBy:', data.room?.createdBy);
      } else {
        setError(data.error || 'Room not found');
      }
    } catch (err) {
      console.error('Load room error:', err);
      setError('Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const handleCamToggle = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCamOn(!isCamOn);
    }
  };

  const handleLeaveRoom = async () => {
    stopStream();
    router.push('/room/join');
  };

  const handleEndRoom = async () => {
    if (!confirm('Are you sure you want to end this room? All participants will be disconnected.')) {
      return;
    }

    try {
      setEndingRoom(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        stopStream();
        router.push('/room/join');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to end room');
        setEndingRoom(false);
      }
    } catch (err) {
      console.error('End room error:', err);
      alert('Failed to end room');
      setEndingRoom(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <button
            onClick={() => router.push('/room/join')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black">
      <div className="p-4 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-white text-xl font-bold">{room?.name}</h1>
          <p className="text-white/60 text-sm">{room?.participants?.length || 0} / {room?.maxParticipants} participants</p>
        </div>
        <div className="flex items-center gap-4">
          {room?.code && (
            <div className="bg-white/5 text-white rounded px-3 py-1 flex items-center gap-2">
              <span className="text-sm">Code: <strong className="ml-1">{room.code}</strong></span>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(room.code);
                    alert('Room code copied to clipboard');
                  } catch (e) {
                    console.warn('Copy failed', e);
                  }
                }}
                className="ml-2 text-sm bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
              >
                Copy
              </button>
            </div>
          )}
          
          {/* Show end room button only for host */}
          {currentUserId && room?.createdBy?._id === currentUserId && (
            <button
              onClick={handleEndRoom}
              disabled={endingRoom}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded font-medium transition"
            >
              {endingRoom ? 'Ending...' : '🛑 End Room'}
            </button>
          )}
        </div>
      </div>
      <CallWindow
        localStream={localStream}
        remoteStreams={remoteStreams}
        participants={room?.participants || []}
        onMicToggle={handleMicToggle}
        onCamToggle={handleCamToggle}
        onLeave={handleLeaveRoom}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
      />
    </div>
  );
}
