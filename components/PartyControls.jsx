"use client";
import React from "react";
import MicButton from "./call/MicButton";
import CamButton from "./call/CamButton";
import Button from "./ui/Button";

export default function PartyControls({
  onMicToggle,
  onCamToggle,
  onLeave,
  onEndRoom,
  isHost = false,
  isMicOn = true,
  isCamOn = true,
  isLoading = false,
  endingRoom = false,
}) {
  return (
    <div className="flex flex-wrap gap-4 justify-center items-center bg-gray-900 p-4 rounded-lg">
      <MicButton isOn={isMicOn} onClick={onMicToggle} disabled={isLoading} />
      <CamButton isOn={isCamOn} onClick={onCamToggle} disabled={isLoading} />
      <Button onClick={onLeave} disabled={isLoading} className="bg-red-700 hover:bg-red-800 text-white">🚪 Leave Call</Button>
      {isHost && (
        <Button onClick={onEndRoom} disabled={isLoading || endingRoom} className="bg-red-800 hover:bg-red-900 text-white">
          {endingRoom ? "⏳ Ending..." : "🛑 End Room"}
        </Button>
      )}
    </div>
  );
}
