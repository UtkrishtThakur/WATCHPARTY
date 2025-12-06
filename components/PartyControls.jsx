import React from 'react';
import Button from './ui/Button';

export default function PartyControls({ 
  onMicToggle, 
  onCamToggle, 
  onLeave,
  isMicOn = true,
  isCamOn = true,
  isLoading = false 
}) {
  return (
    <div className="flex gap-4 justify-center items-center bg-gray-900 p-4 rounded-lg">
      <Button
        onClick={onMicToggle}
        variant={isMicOn ? 'success' : 'danger'}
        disabled={isLoading}
        className="gap-2"
      >
        🎤 {isMicOn ? 'Mic On' : 'Mic Off'}
      </Button>
      
      <Button
        onClick={onCamToggle}
        variant={isCamOn ? 'success' : 'danger'}
        disabled={isLoading}
        className="gap-2"
      >
        📹 {isCamOn ? 'Camera On' : 'Camera Off'}
      </Button>
      
      <Button
        onClick={onLeave}
        variant="danger"
        disabled={isLoading}
      >
        Leave Call
      </Button>
    </div>
  );
}
