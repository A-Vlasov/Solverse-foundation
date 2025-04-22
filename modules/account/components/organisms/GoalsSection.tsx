'use client';

import React, { useState } from 'react';


interface Goal {
  id: string;
  description: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  is_completed: boolean;
  unit?: string; 
}

interface GoalsSectionProps {
  goals?: Goal[]; 
}


export default function GoalsSection({ goals = [] }: GoalsSectionProps) {
  const isLoading = false; 
  const [showAddForm, setShowAddForm] = useState(false);

  const calculateProgress = (current: number, target: number) => {
      if (target <= 0) return 0;
      return Math.min(Math.max((current / target) * 100, 0), 100);
  };

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d]">
      <div className="flex justify-between items-center mb-4">
         <h2 className="text-xl font-semibold text-blue-400">Цели</h2>
         {} 
         <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
         >
             {showAddForm ? 'Отмена' : '+ Добавить цель'}
         </button>
      </div>
       {} 
       {showAddForm && (
            <div className="mb-4 p-4 border border-dashed border-gray-600 rounded-lg">
                <p className="text-gray-400 italic">Форма добавления новой цели...</p>
            </div>
       )}

      {isLoading ? (
        <p className="text-gray-500">Загрузка целей...</p>
      ) : goals.length === 0 && !showAddForm ? (
        <p className="text-gray-400">Цели не установлены...</p>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => {
              const progress = calculateProgress(goal.current_value, goal.target_value);
              return (
                 <li key={goal.id}>
                     <div className="flex justify-between items-baseline mb-1">
                        <p className="font-medium text-gray-200">{goal.description}</p>
                        <p className="text-sm text-gray-400">
                            {goal.current_value}{goal.unit || ''} / {goal.target_value}{goal.unit || ''}
                        </p>
                    </div>
                     {} 
                     <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                     {goal.deadline && <p className="text-xs text-right text-gray-500 mt-1">Дедлайн: {new Date(goal.deadline).toLocaleDateString()}</p>}
                </li>
              );
          })}
        </ul>
      )}
    </div>
  );
} 