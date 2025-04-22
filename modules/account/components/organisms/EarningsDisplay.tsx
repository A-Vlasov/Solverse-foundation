'use client';

import React from 'react';


interface Earnings {
  current_balance: number;
  total_earned: number;
  last_payout?: {
    date: string;
    amount: number;
  };
  currency?: string;
}

interface EarningsDisplayProps {
  earnings?: Earnings | null; 
}


export default function EarningsDisplay({ earnings }: EarningsDisplayProps) {
  const isLoading = false; 
  const currencySymbol = earnings?.currency === 'USD' ? '$' : (earnings?.currency || '');

  return (
    <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d]">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Заработок</h2>
      {isLoading ? (
        <p className="text-gray-500">Загрузка данных о заработке...</p>
      ) : !earnings ? (
        <p className="text-gray-400">Данные пока отсутствуют...</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-400">Текущий баланс</p>
            <p className="text-2xl font-bold text-gray-100">{currencySymbol}{earnings.current_balance.toFixed(2)}</p>
          </div>
           <div>
            <p className="text-sm text-gray-400">Всего заработано</p>
            <p className="text-lg font-medium text-gray-300">{currencySymbol}{earnings.total_earned.toFixed(2)}</p>
          </div>
           {earnings.last_payout && (
             <div>
              <p className="text-sm text-gray-400">Последняя выплата ({new Date(earnings.last_payout.date).toLocaleDateString()})</p>
              <p className="text-lg font-medium text-gray-300">{currencySymbol}{earnings.last_payout.amount.toFixed(2)}</p>
            </div>
           )}
           {}
        </div>
      )}
    </div>
  );
} 