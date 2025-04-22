'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth';








const MockSection: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#2a2a2a] p-6 rounded-xl shadow-lg border border-[#3d3d3d]">
    <h2 className="text-xl font-semibold mb-4 text-pink-400">{title}</h2>
    <div className="text-gray-300">
      {children || <p>Содержимое раздела...</p>}
    </div>
  </div>
);

const TestChatInterface = () => <MockSection title="Тестовый Чат"><p>Интерфейс для прохождения тестового чата.</p></MockSection>;
const AchievementsSection = () => <MockSection title="Достижения">
    <ul>
        <li>- Первое сообщение (не получено)</li>
        <li>- 1 час онлайн (не получено)</li>
    </ul>
</MockSection>;
const EarningsDisplay = () => <MockSection title="Заработок"><p>За сегодня: $0.00</p><p>За месяц: $0.00</p></MockSection>;
const StatisticsSection = () => <MockSection title="Статистика"><p>Среднее время ответа: -</p><p>Сообщений в час: -</p></MockSection>;
const GoalsSection = () => <MockSection title="Цели"><p>Цель на месяц: $1000 (0%)</p></MockSection>;


interface CandidateFormStatus {
  form_completed?: boolean;
}


const AccountHeader = () => (
  <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
      Личный Кабинет
    </h1>
    {} 
  </div>
);


const Loader = () => (
    <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full"></div>
    </div>
);

export default function AccountPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [isFormChecked, setIsFormChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formCompleted, setFormCompleted] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user?.id && !isFormChecked) {
      const checkFormStatus = async () => {
        setIsLoading(true); 
        try {
          console.log(`Checking candidate form status for user: ${user.id}`);
          const response = await fetch(`/api/candidate-form?employeeId=${user.id}`);

          if (response.status === 404) {
            console.log('Candidate form not found, redirecting...');
            router.push('/candidate');
            
            return;
          }

          if (!response.ok) {
            console.error('Error fetching candidate form status:', response.statusText);
            
            setIsFormChecked(true);
            setFormCompleted(false); 
            setIsLoading(false); 
            return;
          }

          const formData: CandidateFormStatus = await response.json();

          if (!formData?.form_completed) {
            console.log('Candidate form not completed, redirecting...');
            router.push('/candidate');
            
            return;
          } else {
            console.log('Candidate form is completed.');
            setFormCompleted(true);
            setIsFormChecked(true);
            setIsLoading(false); 
          }

        } catch (error) {
          console.error('Failed to check candidate form status:', error);
          setIsFormChecked(true);
          setFormCompleted(false);
          setIsLoading(false); 
        } 
      };

      checkFormStatus();
    } else if (!isAuthLoading && !user) {
      console.warn('User not found after auth check in AccountPage.');
      setIsLoading(false); 
    } else if (isFormChecked) {
        
        setIsLoading(false);
    }

  }, [user, isAuthLoading, router, isFormChecked]);

  
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#181818]">
        <Loader />
      </div>
    );
  }
  
  
  if (!user) {
      
      
      return (
          <div className="flex justify-center items-center min-h-screen bg-[#181818] text-gray-100">
              <p>Пожалуйста, войдите в систему.</p>
          </div>
      );
  }
  
  
  
  if (!formCompleted) {
       return (
          <div className="flex justify-center items-center min-h-screen bg-[#181818] text-gray-100">
              <p>Пожалуйста, заполните анкету кандидата.</p>
               <button onClick={() => router.push('/candidate')} className="ml-4 px-4 py-2 bg-blue-500 rounded">Перейти к анкете</button>
          </div>
      );
  }

  
  return (
    <div className="min-h-screen bg-[#181818] text-gray-100 p-6">
      <AccountHeader />

      {} 
      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {} 
        <div className="lg:col-span-1 flex flex-col gap-6">
          <MockSection title="Статус Анкеты">
              <p>Анкета успешно заполнена.</p>
          </MockSection>
          <TestChatInterface />
        </div>

        {} 
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatisticsSection />
          <EarningsDisplay />
          <GoalsSection />
          <AchievementsSection />
        </div>
      </div>
      {} 

      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/chat')} 
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-lg font-medium shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          disabled 
        >
          Приступить к работе
        </button>
      </div>
    </div>
  );
} 