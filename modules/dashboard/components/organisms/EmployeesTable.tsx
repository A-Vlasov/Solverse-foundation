"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCandidateForm } from '../../lib/supabase';

interface EmployeesTableProps {
  employees: any[];
}

const EmployeesTable: React.FC<EmployeesTableProps> = ({ employees }) => {
  const [employeesWithTelegram, setEmployeesWithTelegram] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchTelegrams() {
      const enriched = await Promise.all(
        employees.map(async (employee) => {
          let telegram_tag;
          try {
            const form = await getCandidateForm(employee.id);
            telegram_tag = form?.telegram_tag || undefined;
          } catch {}
          return { ...employee, telegram_tag };
        })
      );
      setEmployeesWithTelegram(enriched);
    }
    fetchTelegrams();
  }, [employees]);

  return (
    <div className="overflow-x-auto">
      {}
      <table className="w-full bg-[#232323] rounded-xl text-gray-100">
        <thead className="sticky top-0 bg-[#232323] z-10">
          <tr className="text-left text-gray-400 border-b border-[#333]">
            <th className="pb-3 pl-4 font-medium">Сотрудник</th>
            <th className="pb-3 pl-4 font-medium">Telegram</th>
          </tr>
        </thead>
        <tbody>
          {employeesWithTelegram.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-[#333] hover:bg-[#282828] transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/employee/${employee.id}`)}
            >
              {}
              <td className="py-3 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                    {employee.first_name && employee.first_name[0] ? employee.first_name[0].toUpperCase() : '?'}
                  </div>
                  <span className="text-white font-medium">{employee.first_name || 'Без имени'}</span>
                </div>
              </td>
              {}
              <td className="py-3 pl-4">
                {employee.telegram_tag ? (
                  <span className="text-blue-400 font-medium">{employee.telegram_tag}</span>
                ) : (
                  <span className="text-gray-400 italic">Не указан</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeesTable; 