import React from 'react';

type ScoreValueProps = {
  value: number;
  className?: string;
};

export const ScoreValue: React.FC<ScoreValueProps> = ({ value, className }) => (
  <span className={`font-semibold ${className || ''}`}>{value.toFixed(1)}</span>
); 