import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
}

const Loader: React.FC<LoaderProps> = ({ size = 'medium' }) => {
  const sizeClass = 
    size === 'small' ? 'w-4 h-4 border-2' :
    size === 'large' ? 'w-12 h-12 border-4' :
    'w-8 h-8 border-2';
  
  return (
    <div className={`${sizeClass} border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`} />
  );
};

export default Loader; 