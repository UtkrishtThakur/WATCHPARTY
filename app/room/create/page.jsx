'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName,
          maxParticipants: parseInt(maxParticipants),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('currentRoom', JSON.stringify(data.room));
        // Show the room and code instead of redirecting immediately
        setCreatedRoom(data.room);
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Create room error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (createdRoom?.code) {
      try {
        navigator.clipboard.writeText(createdRoom.code);
        alert('Room code copied to clipboard!');
      } catch (err) {
        console.error('Copy failed:', err);
        alert('Failed to copy code');
      }
    }
  };

  const handleEnterRoom = () => {
    if (createdRoom?._id) {
      router.push(`/room/${createdRoom._id}`);
    }
  };

  if (createdRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ Room Created!
          </h1>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <p className="text-gray-600 text-sm mb-2">Room Name</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {createdRoom.name}
            </h2>

            <p className="text-gray-600 text-sm mb-2">Share this code:</p>
            <div className="bg-white border-2 border-green-600 p-4 rounded mb-4 flex items-center justify-between">
              <code className="text-2xl font-mono font-bold text-green-600">
                {createdRoom.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Share this code with friends so they can join your room!
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleEnterRoom}
              variant="primary"
              className="w-full"
            >
              🎬 Enter Room
            </Button>
            <button
              onClick={() => {
                setCreatedRoom(null);
                setRoomName('');
              }}
              className="w-full text-green-600 hover:text-green-700 font-medium"
            >
              Create Another Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          Create a Room
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Max Participants
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="2"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !roomName}
            variant="primary"
            className="w-full"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </form>

        <button
          onClick={() => router.push('/room/join')}
          className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Join existing room instead
        </button>
      </div>
    </div>
  );
}
