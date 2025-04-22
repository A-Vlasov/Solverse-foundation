import React from 'react';
import { WarningIcon } from '../atoms/icons/WarningIcon';
import { ChartBarIcon } from '../atoms/icons/ChartBarIcon';
import EmptySection from './EmptySection';

interface FrequentErrorsSectionProps {
  errors: { id: string | number; description: string; count: number }[];
}

const FrequentErrorsSection: React.FC<FrequentErrorsSectionProps> = ({ errors }) => (
  <div className="bg-[#232323] rounded-2xl p-0 border border-[#333] shadow-lg overflow-hidden">
    <div className="sticky top-0 z-10 bg-[#232323] flex items-center justify-between px-6 py-5 border-b border-[#333]">
      <div className="flex items-center gap-2">
        <WarningIcon className="w-5 h-5 text-yellow-400" />
        <h2 className="text-xl font-semibold text-gray-100">Частые ошибки</h2>
      </div>
      <ChartBarIcon className="w-5 h-5 text-gray-500" />
    </div>
    <div className="px-6 py-4 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#232323]">
      {errors.length > 0 ? (
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          {errors.map((error) => (
            <li key={error.id} className="flex justify-between items-center hover:bg-[#282828] rounded px-2 py-1 transition-colors">
              <span>{error.description}</span>
              <span className="text-gray-400 text-sm font-mono bg-[#181818] rounded px-2 py-0.5 ml-2">{error.count} раз</span>
            </li>
          ))}
        </ol>
      ) : (
        <EmptySection message="Нет данных о частых ошибках." Icon={WarningIcon} />
      )}
    </div>
  </div>
);

export default FrequentErrorsSection; 