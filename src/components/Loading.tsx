import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
} 