import React from 'react';

export default function ParticipantsBar({ participants = [] }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <h3 className="font-semibold mb-3">Participants ({participants.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant._id || participant.id}
            className="flex items-center gap-2 p-2 bg-gray-800 rounded"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">{participant.name || 'Anonymous'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
