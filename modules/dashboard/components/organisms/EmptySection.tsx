import React from 'react';

interface EmptySectionProps {
  message: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

const EmptySection: React.FC<EmptySectionProps> = ({ message, Icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    {Icon && <Icon className="w-10 h-10 mb-3 opacity-40" />}
    <span className="italic text-center">{message}</span>
  </div>
);

export default EmptySection; 