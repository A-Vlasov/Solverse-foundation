import React from 'react';

const Loader: React.FC = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-purple-500 rounded-full"></div>
  </div>
);

export default Loader; 