import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, AlertCircle } from 'lucide-react';

interface CandidateData {
  firstName: string;
  lastName: string;
  userId?: string;
  startDate?: string;
  aboutMe?: string;
  questions?: Record<string, string>;
}

function TestInfo() {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  
  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem('candidateData') || '{}') as CandidateData;
    console.log('Loading candidate data in TestInfo:', data);
    
    // Проверяем наличие обязательных полей
    if (!data.firstName || !data.lastName) {
      console.warn('Missing required fields in TestInfo:', data);
      // Возвращаем пользователя на форму, если данные отсутствуют
      navigate('/candidate');
      return;
    }
    
    setCandidateData(data);
  }, [navigate]);

  const handleStartTest = () => {
    // Проверяем наличие данных перед началом тестирования
    if (!candidateData || !candidateData.firstName || !candidateData.lastName) {
      console.warn('Missing candidate data before starting test:', candidateData);
      navigate('/candidate');
      return;
    }
    
    console.log('Starting test with candidate data:', candidateData);
    navigate('/chat');
  };

  if (!candidateData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-[#2d2d2d] rounded-2xl shadow-xl w-full max-w-3xl p-8 border border-[#3d3d3d]">
        <div className="flex flex-col items-center mb-8">
          <ClipboardList className="w-20 h-20 text-pink-500 mb-4" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-center">
            Информация о тестировании
          </h1>
          <p className="text-gray-400 mt-2">
            Здравствуйте, {candidateData.firstName} {candidateData.lastName}!
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-pink-500" />
              Цель тестирования
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Данное тестирование предназначено для оценки ваших профессиональных навыков и знаний.
              Результаты помогут нам лучше понять ваши сильные стороны и области для развития.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <Clock className="w-6 h-6 text-pink-500" />
              Условия тестирования
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Продолжительность теста: 60 минут</li>
              <li>Количество вопросов: 30</li>
              <li>Минимальный проходной балл: 70%</li>
              <li>Возможность вернуться к предыдущим вопросам</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">Правила тестирования</h2>
            <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg p-4 space-y-2">
              <p className="text-gray-400">
                1. Убедитесь, что у вас стабильное интернет-соединение
              </p>
              <p className="text-gray-400">
                2. Не используйте сторонние материалы или помощь других людей
              </p>
              <p className="text-gray-400">
                3. Отвечайте на вопросы самостоятельно и честно
              </p>
              <p className="text-gray-400">
                4. При технических проблемах обратитесь к администратору
              </p>
            </div>
          </section>

          <div className="pt-6">
            <button
              onClick={handleStartTest}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-5 h-5" />
              Начать тестирование
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestInfo;