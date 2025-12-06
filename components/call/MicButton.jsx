import React from 'react';

export default function MicButton({ isOn = true, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-full transition-all ${
        isOn
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-red-600 hover:bg-red-700 text-white'
      } disabled:opacity-60`}
      title={isOn ? 'Microphone is on' : 'Microphone is off'}
    >
      🎤
    </button>
  );
}
