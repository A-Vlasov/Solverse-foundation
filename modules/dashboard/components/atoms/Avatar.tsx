import React from 'react';

interface AvatarProps {
  name?: string; 
  
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, className = '' }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  
  const bgColor = React.useMemo(() => {
    if (!name) return 'bg-gray-500';
    const charCodeSum = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
    return colors[charCodeSum % colors.length];
  }, [name, initials]);

  return (
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${bgColor} ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar; 