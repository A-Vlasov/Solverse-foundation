'use client';

import React from 'react';


interface Achievement {
  id: string;
  name: string;
  description: string;
  achieved_at?: string;
  icon?: string; 
}

interface AchievementsSectionProps {
  achievements?: Achievement[]; 
}


export default function AchievementsSection({ achievements = [] }: AchievementsSectionProps) {
  const isLoading = false; 

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d]">
      <h2 className="text-xl font-semibold mb-4 text-red-400">Достижения</h2>
      {isLoading ? (
        <p className="text-gray-500">Загрузка достижений...</p>
      ) : achievements.length === 0 ? (
        <p className="text-gray-400">Достижений пока нет...</p>
      ) : (
        <ul className="space-y-3">
          {} 
          {achievements.map((ach) => (
             <li key={ach.id} className="flex items-center gap-3">
               {} 
               <span className="text-lg">🏆</span> 
               <div>
                 <p className="font-medium text-gray-200">{ach.name}</p>
                 <p className="text-sm text-gray-400">{ach.description}</p>
               </div>
             </li>
          ))}
        </ul>
      )}
    </div>
  );
} 