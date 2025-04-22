"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import EmployeesTable from './EmployeesTable';
import EmptySection from './EmptySection';
import { UsersIcon } from '../atoms/icons/UsersIcon';
import { SearchIcon } from '../atoms/icons/SearchIcon';
import { FilterIcon } from '../atoms/icons/FilterIcon';

interface EmployeesSectionProps {
  employees: any[];
  isLoading?: boolean;
}

const EmployeesSection: React.FC<EmployeesSectionProps> = ({ employees, isLoading }) => {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(employee => {
      const departmentMatch = departmentFilter === 'all' || employee.department === departmentFilter;
      const levelMatch = levelFilter === 'all' || employee.level === levelFilter;
      const searchMatch = !searchTerm || (employee.first_name && employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return departmentMatch && levelMatch && searchMatch;
    });
  }, [employees, departmentFilter, levelFilter, timeFilter, searchTerm]);

  if (isLoading) {
    return (
      <div className="bg-[#232323] rounded-2xl p-6 border border-[#333] shadow-lg min-h-[300px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#232323] rounded-2xl p-0 border border-[#333] shadow-lg overflow-hidden">
      <div className="sticky top-0 z-10 bg-[#232323] flex items-center justify-between px-6 py-5 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-100">Сотрудники</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#181818] pl-8 pr-2 py-1 rounded text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          <button onClick={() => setDepartmentFilter(departmentFilter === 'all' ? 'selected_dept' : 'all')} className={`bg-[#181818] px-3 py-1 rounded text-sm ${departmentFilter !== 'all' ? 'text-white font-semibold' : 'text-gray-400'} hover:bg-[#282828] transition`}>
            {departmentFilter === 'all' ? 'Все отделы' : 'Выбранный отдел'}
          </button>
          <button onClick={() => setLevelFilter(levelFilter === 'all' ? 'selected_level' : 'all')} className={`bg-[#181818] px-3 py-1 rounded text-sm ${levelFilter !== 'all' ? 'text-white font-semibold' : 'text-gray-400'} hover:bg-[#282828] transition`}>
            {levelFilter === 'all' ? 'Все уровни' : 'Выбранный уровень'}
          </button>
          <button onClick={() => setTimeFilter(timeFilter === 'all' ? 'selected_time' : 'all')} className={`bg-[#181818] px-3 py-1 rounded text-sm ${timeFilter !== 'all' ? 'text-white font-semibold' : 'text-gray-400'} hover:bg-[#282828] transition`}>
            {timeFilter === 'all' ? 'Все время' : 'Выбранное время'}
          </button>
          <button className="p-2 rounded hover:bg-[#282828] transition"><FilterIcon className="w-5 h-5 text-gray-500 hover:text-gray-300" /></button>
        </div>
      </div>
      <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#232323] px-2 pb-2">
        {filteredEmployees.length > 0 ? (
          <EmployeesTable employees={filteredEmployees} />
        ) : (
          <EmptySection message="Нет сотрудников, соответствующих фильтрам" Icon={UsersIcon} />
        )}
      </div>
    </div>
  );
};

export default EmployeesSection; 