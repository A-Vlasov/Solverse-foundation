import React from 'react';
import Link from 'next/link';
import { UserPlusIcon } from '../atoms/icons/UserPlusIcon';
import { UserProfile } from '@/modules/auth';

const DashboardHeader: React.FC = () => (
  <div className="flex flex-col md:flex-row justify-between items-start mb-8">
    <div className="flex-1">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text mb-1">
        Панель управления
      </h1>
      <p className="text-gray-400 text-sm">Обзор тренингов и прогресса сотрудников</p>
    </div>
    
    <div className="flex items-center mt-4 md:mt-0 space-x-4 w-full md:w-auto">
      <UserProfile className="mr-4" />
      
      <Link 
        href="/employees/new"
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
      >
        <UserPlusIcon className="w-4 h-4 mr-2" />
        Новый сотрудник
      </Link>
    </div>
  </div>
);

export default DashboardHeader; 