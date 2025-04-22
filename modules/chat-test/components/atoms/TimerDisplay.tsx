
import React from 'react';
import { Timer } from 'lucide-react'; 

interface TimerDisplayProps {
  timeRemaining: number; 
}

export default function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={`p-4 border-t border-gray-200 text-center font-semibold ${
      timeRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'
    }`}>
      <Timer size={18} className="inline-block mr-2" />
      Время: {formatTime(timeRemaining)}
    </div>
  );
} 