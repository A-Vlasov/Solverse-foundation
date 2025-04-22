import { ArrowLeft } from 'lucide-react';
import React from 'react';

type BackButtonProps = {
  onClick?: () => void;
  className?: string;
};

export const BackButton: React.FC<BackButtonProps> = ({ onClick, className }) => (
  <button
    onClick={onClick}
    className={`p-2 bg-[#2a2a2a] rounded-full hover:bg-[#3a3a3a] transition-all ${className || ''}`}
    aria-label="Назад"
  >
    <ArrowLeft className="w-5 h-5" />
  </button>
); 