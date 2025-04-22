"use client";
import React from 'react';
import StatusBadge from '../atoms/StatusBadge';
import Avatar from '../atoms/Avatar';
import { useRouter } from 'next/navigation';

interface SessionRowProps {
  session: {
    id: string;
    created_at: string;
    completed: boolean;
    employee_id: string;
    employee_name?: string;
    message_count?: number;
    telegram_tag?: string;
  };
}

const SessionRow: React.FC<SessionRowProps> = ({ session }) => {
  const dateTime = new Date(session.created_at);
  const date = dateTime.toLocaleDateString('ru-RU');
  const time = dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const router = useRouter();
  const messageCount = session.message_count ?? 0;

  return (
    <tr
      className="border-b border-[#333] hover:bg-[#282828] transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/session/${session.id}`)}
    >
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-sm font-medium">
            {session.employee_name && session.employee_name[0] ? session.employee_name[0].toUpperCase() : '?'}
          </div>
          <div>
            <div className="font-medium text-white">{session.employee_name || 'Неизвестный сотрудник'}</div>
            {session.telegram_tag && (
              <div className="text-sm text-blue-400 font-medium">{session.telegram_tag}</div>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-3 text-gray-100">
        <div>{date}</div>
        <div className="text-sm text-gray-400">{time}</div>
      </td>
      <td className="py-4 px-3 text-gray-100 text-center font-medium">{messageCount}</td>
      <td className="py-4 px-3 text-center">
        <StatusBadge completed={session.completed} />
      </td>
    </tr>
  );
};

export default SessionRow; 