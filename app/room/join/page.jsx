/**
 * File: app/room/join/page.jsx
 * Purpose: Join room page UI - lists user's rooms, join by code input, copy/enter/delete buttons
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { logout } from '@/app/utils/logout';

export default function JoinRoomPage() {
  const [myRooms, setMyRooms] = useState([]);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch user's created rooms
  useEffect(() => {
    const fetchMyRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const res = await fetch('/api/room/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setMyRooms(data.rooms || []);
        }
      } catch (err) {
        console.error('Fetch rooms error:', err);
      } finally {
        setFetchingRooms(false);
      }
    };

    fetchMyRooms();
  }, [router]);

  const handleCopyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
      alert('Room code copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Failed to copy code');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? All participants will be removed.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/room/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Refresh the rooms list after deletion
        setMyRooms(myRooms.filter(room => room._id !== roomId));
        alert('Room deleted successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete room');
      }
    } catch (err) {
      console.error('Delete room error:', err);
      alert('Failed to delete room');
    }
  };

  const handleJoinByCode = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      if (!roomCodeInput.trim()) {
        setError('Please enter a room code');
        return;
      }

      setLoading(true);
      setError('');

      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: roomCodeInput.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        const room = data.room;
        localStorage.setItem('currentRoom', JSON.stringify(room));
        router.push(`/room/${room._id}`);
      } else {
        setError(data.error || 'Failed to join room. Check the code and try again.');
      }
    } catch (err) {
      console.error('Join by code error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await res.json();
      if (res.ok) {
        const room = data.room;
        localStorage.setItem('currentRoom', JSON.stringify(room));
        router.push(`/room/${room._id}`);
      }
    } catch (err) {
      console.error('Join room error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-600 to-blue-800 p-4">
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Join a Room
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* My Rooms Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Created Rooms</h2>
            {fetchingRooms ? (
              <p className="text-gray-600">Loading your rooms...</p>
            ) : myRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRooms.map((room) => (
                  <div
                    key={room._id}
                    className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <h3 className="font-bold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">Code:</p>
                    <div className="flex items-center gap-2 mb-3 bg-gray-100 p-2 rounded">
                      <span className="font-mono font-bold text-blue-600 text-sm flex-1">{room.code}</span>
                      <button
                        onClick={() => handleCopyCode(room.code)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {room.participants?.length || 0} / {room.maxParticipants} participants
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleJoinRoom(room._id)}
                        variant="primary"
                        className="flex-1"
                      >
                        Enter Room
                      </Button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded font-medium transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No rooms created yet. Create one to get started!</p>
            )}
          </div>

          <div className="border-t pt-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Join by Code</h2>
            <p className="text-center text-gray-600 mb-4">
              Enter a room code shared by a friend
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  placeholder="Paste room code here"
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleJoinByCode}
                disabled={loading || !roomCodeInput.trim()}
                variant="primary"
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <button
              onClick={() => router.push('/room/create')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create a room instead
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
