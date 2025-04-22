import React from 'react';

interface StatusBadgeProps {
  status?: string;
  completed?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, completed }) => {
  if (typeof completed === 'boolean') {
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${
        completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {completed ? 'Завершена' : 'В процессе'}
      </span>
    );
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${
      status === 'active' ? 'bg-green-100 text-green-800' :
      status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {status || 'Не указан'}
    </span>
  );
};

export default StatusBadge; 