import React from 'react';
import { ScoreValue } from '../atoms/ScoreValue';

type ParameterCardProps = {
  icon: React.ReactNode;
  name: string;
  score: number;
  comment: string;
  colorClass: string;
  scoreColorClass: string;
  renderStars: (score: number) => React.ReactNode;
};

export const ParameterCard: React.FC<ParameterCardProps> = ({ icon, name, score, comment, colorClass, scoreColorClass, renderStars }) => (
  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-medium">{name}</h4>
          <div className="flex items-center gap-1">{renderStars(score)}</div>
        </div>
        <p className="text-gray-400">{comment}</p>
        <div className="mt-2 text-right">
          <ScoreValue value={score} className={scoreColorClass} />
          <span className="text-gray-400 text-sm"> / 5</span>
        </div>
      </div>
    </div>
  </div>
); 