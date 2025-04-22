import React from 'react';

type RecommendationCardProps = {
  text: string;
  className?: string;
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ text, className }) => (
  <div className={`bg-[#2d2d2d] rounded-lg p-4 border border-[#3d3d3d] text-gray-200 ${className || ''}`}>
    {text}
  </div>
); 