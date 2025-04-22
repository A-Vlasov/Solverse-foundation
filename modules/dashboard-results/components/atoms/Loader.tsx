import React from 'react';

export const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-16 h-16 border-4 border-t-pink-500 border-pink-500/20 rounded-full animate-spin ${className || ''}`}></div>
); 