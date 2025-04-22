import React from 'react';
import { ArrowLeft } from 'lucide-react';

type SessionCardProps = {
  name: string;
  date: string;
  onClick: () => void;
  className?: string;
};

export const SessionCard: React.FC<SessionCardProps> = ({ name, date, onClick, className }) => (
  <div
    className={`bg-[#2a2a2a] p-4 rounded-lg border border-[#3d3d3d] hover:border-blue-500 transition-all cursor-pointer ${className || ''}`}
    onClick={onClick}
  >
    <div className="flex justify-between items-center">
      <div>
        <h5 className="font-medium">{name}</h5>
        <p className="text-sm text-gray-400">{date}</p>
      </div>
      <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
        <ArrowLeft className="w-5 h-5 transform rotate-180" />
      </div>
    </div>
  </div>
); 