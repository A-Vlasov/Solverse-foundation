import React from 'react';
import SessionRow from '../molecules/SessionRow';

interface SessionsTableProps {
  sessions: any[];
}

const SessionsTable: React.FC<SessionsTableProps> = ({ sessions }) => (
  <div className="overflow-x-auto">
    <table className="w-full bg-dark-2 rounded-xl text-gray-100">
      <thead>
        <tr className="border-b border-dark-3">
          <th className="py-3 px-4 text-left text-gray-400 font-medium">Пользователь</th>
          <th className="py-3 px-4 text-left text-gray-400 font-medium">Дата/Время</th>
          <th className="py-3 px-4 text-center text-gray-400 font-medium">Сообщения</th>
          <th className="py-3 px-4 text-center text-gray-400 font-medium">Статус</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </tbody>
    </table>
  </div>
);

export default SessionsTable; 