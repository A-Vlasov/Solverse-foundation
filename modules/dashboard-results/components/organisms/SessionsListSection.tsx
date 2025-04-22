import React from 'react';
import { SessionCard } from '../molecules/SessionCard';

type SessionsListSectionProps = {
  sessions: Array<{ id: string; name: string; date: string }>;
  onSessionClick: (id: string) => void;
};

export const SessionsListSection: React.FC<SessionsListSectionProps> = ({ sessions, onSessionClick }) => (
  <div className="space-y-3 mt-4">
    {sessions.map(session => (
      <SessionCard
        key={session.id}
        name={session.name}
        date={session.date}
        onClick={() => onSessionClick(session.id)}
      />
    ))}
  </div>
); 