import React from 'react';
import Link from 'next/link';
import SessionsTable from './SessionsTable';
import EmptySection from './EmptySection';

interface SessionsSectionProps {
  sessions: any[];
}

const SessionsSection: React.FC<SessionsSectionProps> = ({ sessions }) => (
  <div className="bg-dark-2 rounded-2xl p-6 border border-dark-3 mb-8">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-100">Последние тесты</h2>
      <Link 
        href="/test-sessions" 
        className="text-blue-400 hover:underline"
      >
        Смотреть все
      </Link>
    </div>
    {sessions.length > 0 ? (
      <SessionsTable sessions={sessions} />
    ) : (
      <EmptySection message="Нет тестовых сессий для отображения" />
    )}
  </div>
);

export default SessionsSection; 