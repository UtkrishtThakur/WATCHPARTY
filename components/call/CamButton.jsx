import React from "react";

export default function MicButton({ isOn = true, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-full transition-all duration-200 text-white ${isOn ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
      title={isOn ? "Microphone is on" : "Microphone is off"}
    >
      {isOn ? "🎤" : "🔇"}
    </button>
  );
}
