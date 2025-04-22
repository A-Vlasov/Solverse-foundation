'use client';

import React from 'react';


interface Statistics {
  messages_sent?: number;
  avg_response_time?: number; 
  conversion_rate?: number; 
  active_chats?: number;
  
}

interface StatisticsSectionProps {
  stats?: Statistics | null; 
}


export default function StatisticsSection({ stats }: StatisticsSectionProps) {
  const isLoading = false; 

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d]">
      <h2 className="text-xl font-semibold mb-4 text-green-400">Статистика</h2>
      {isLoading ? (
        <p className="text-gray-500">Загрузка статистики...</p>
      ) : !stats ? (
        <p className="text-gray-400">Данные пока отсутствуют...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {stats.messages_sent !== undefined && (
            <div>
              <p className="text-sm text-gray-400">Сообщений отправлено</p>
              <p className="text-lg font-medium text-gray-100">{stats.messages_sent}</p>
            </div>
          )}
           {stats.avg_response_time !== undefined && (
            <div>
              <p className="text-sm text-gray-400">Ср. время ответа</p>
              <p className="text-lg font-medium text-gray-100">{stats.avg_response_time} сек</p>
            </div>
          )}
          {stats.conversion_rate !== undefined && (
             <div>
              <p className="text-sm text-gray-400">Конверсия</p>
              <p className="text-lg font-medium text-gray-100">{(stats.conversion_rate * 100).toFixed(1)}%</p>
            </div>
          )}
           {stats.active_chats !== undefined && (
             <div>
              <p className="text-sm text-gray-400">Активные чаты</p>
              <p className="text-lg font-medium text-gray-100">{stats.active_chats}</p>
            </div>
          )}
          {} 
        </div>
      )}
    </div>
  );
} 