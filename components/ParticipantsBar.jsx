import React from "react";
import { Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";

export default function ParticipantsBar({ participants = [], hostId = null }) {
  const normalized = participants.map((p) => ({
    id: p._id || p.id || crypto.randomUUID(),
    name: p.name || "Anonymous",
    isMicOn: p.isMicOn ?? true,
    isCamOn: p.isCamOn ?? true,
    isHost: p._id === hostId,
  }));

  const sorted = normalized.sort((a, b) => (a.isHost ? -1 : b.isHost ? 1 : a.name.localeCompare(b.name)));

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-3">Participants ({sorted.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {sorted.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium flex items-center gap-1">
                {p.name}
                {p.isHost && <Crown size={14} className="text-yellow-400" />}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              {p.isMicOn ? <Mic size={16} /> : <MicOff size={16} className="text-red-400" />}
              {p.isCamOn ? <Video size={16} /> : <VideoOff size={16} className="text-red-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
