import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, AlertCircle } from 'lucide-react';
import { getCandidateForm } from '../lib/supabase';

interface CandidateData {
  userId?: string;
  first_name?: string;
  telegram_tag?: string;
  shift?: string;
  testSessionId?: string;
  token?: string;
  formCompleted?: boolean;
}

function TestInfo() {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCandidateData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Получаем данные из sessionStorage
        const data = JSON.parse(sessionStorage.getItem('candidateData') || '{}') as CandidateData;
        console.log('Loading candidate data in TestInfo:', data);
        
        // Проверяем наличие обязательных полей
        if (!data.userId) {
          console.warn('Missing required fields in TestInfo:', data);
          // Возвращаем пользователя на форму, если данные отсутствуют
          navigate('/candidate');
          return;
        }
        
        // Если форма уже заполнена, используем данные из sessionStorage
        if (data.formCompleted) {
          setCandidateData(data);
        } else {
          // Иначе пытаемся получить данные из базы данных
          const formData = await getCandidateForm(data.userId);
          
          if (formData) {
            // Если данные найдены, обновляем sessionStorage
            const updatedData = {
              ...data,
              first_name: data.first_name, // Используем имя из сессии, т.к. оно в employees
              telegram_tag: formData.telegram_tag,
              shift: formData.shift,
              formCompleted: true
            };
            
            sessionStorage.setItem('candidateData', JSON.stringify(updatedData));
            setCandidateData(updatedData);
          } else {
            // Если данные не найдены, возвращаем пользователя на форму
            console.warn('Candidate form data not found, redirecting to form');
            navigate('/candidate');
            return;
          }
        }
      } catch (err) {
        console.error('Error loading candidate data:', err);
        setError('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCandidateData();
  }, [navigate]);

  const handleStartTest = () => {
    // Проверяем наличие данных перед началом тестирования
    if (!candidateData || !candidateData.userId) {
      console.warn('Missing candidate data before starting test:', candidateData);
      navigate('/candidate');
      return;
    }
    
    console.log('Starting test with candidate data:', candidateData);
    
    // Проверяем наличие ID тестовой сессии
    if (candidateData.testSessionId) {
      console.log('Redirecting to existing test session:', candidateData.testSessionId);
      navigate(`/test-session/${candidateData.testSessionId}`);
    } else {
      // Если ID сессии нет, переходим к чату для создания новой сессии
      console.log('No test session ID found, redirecting to chat');
      navigate('/chat');
    }
  };

  // Отображаем индикатор загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }
  
  // Отображаем сообщение об ошибке
  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#2d2d2d] rounded-2xl shadow-xl w-full max-w-3xl p-8 border border-[#3d3d3d]">
          <div className="flex flex-col items-center mb-8">
            <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-center">
              Ошибка загрузки
            </h1>
            <p className="text-gray-400 mt-2 text-center">{error}</p>
          </div>
          <button
            onClick={() => navigate('/candidate')}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold rounded-lg transition duration-200"
          >
            Вернуться к форме
          </button>
        </div>
      </div>
    );
  }

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
            Здравствуйте, {candidateData.first_name || 'соискатель'}!
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
              <li>Продолжительность теста: 5 минут</li>
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