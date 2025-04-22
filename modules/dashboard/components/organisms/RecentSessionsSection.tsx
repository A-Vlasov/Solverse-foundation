import React from 'react';
import SessionsTable from './SessionsTable';
import EmptySection from './EmptySection';
import { ClockIcon } from '../atoms/icons/ClockIcon';

interface RecentSessionsSectionProps {
  sessions: any[];
}

const RecentSessionsSection: React.FC<RecentSessionsSectionProps> = ({ sessions }) => (
  <div className="bg-[#232323] rounded-2xl p-0 border border-[#333] mb-8 shadow-lg overflow-hidden">
    {}
    <div className="sticky top-0 z-10 bg-[#232323] flex items-center gap-2 px-6 py-5 border-b border-[#333]">
      <ClockIcon className="w-5 h-5 text-blue-400" />
      <h2 className="text-xl font-semibold text-gray-100">Недавние тестирования</h2>
    </div>
    <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#232323] px-2 pb-2">
      {sessions.length > 0 ? (
        <SessionsTable sessions={sessions} />
      ) : (
        <EmptySection message="Нет недавних тестовых сессий для отображения" Icon={ClockIcon} />
      )}
    </div>
  </div>
);

export default RecentSessionsSection; 