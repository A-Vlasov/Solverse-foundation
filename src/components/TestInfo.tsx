import React, { useEffect, useState, useRef } from 'react';
import { useNavigation } from '../../app/components/SimpleNavigation';
import { ClipboardList, Clock, AlertCircle } from 'lucide-react';
import { getCandidateForm } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';

interface CandidateData {
  userId?: string;
  employee_id?: string;
  first_name?: string;
  telegram_tag?: string;
  shift?: string;
  testSessionId?: string;
  token?: string;
  formCompleted?: boolean;
}

function TestInfo() {
  const { navigate } = useNavigation();
  const { locale, t } = useLocale();
  // Используем ref для отслеживания, был ли уже выполнен редирект
  const redirected = useRef(false);
  const [candidateData, setCandidateData] = useState<CandidateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Предотвращаем повторный запуск эффекта
    if (redirected.current) return;
    
    const loadCandidateData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Получаем данные из sessionStorage
        const data = JSON.parse(sessionStorage.getItem('candidateData') || '{}') as CandidateData;
        console.log('Loading candidate data in TestInfo:', data);
        
        // Проверяем наличие обязательных полей (либо userId, либо employee_id)
        if (!data.userId && !data.employee_id) {
          console.warn('Missing required fields in TestInfo:', data);
          // Возвращаем пользователя на форму, если данные отсутствуют
          redirected.current = true;
          navigate(`/candidate?lang=${locale}`);
          return;
        }
        
        // Если форма уже заполнена, используем данные из sessionStorage
        if (data.formCompleted) {
          setCandidateData(data);
        } else {
          // Иначе пытаемся получить данные из базы данных
          const userId = data.userId || data.employee_id;
          if (!userId) {
            console.warn('No user ID available for candidate form lookup');
            redirected.current = true;
            navigate(`/candidate?lang=${locale}`);
            return;
          }
          
          const formData = await getCandidateForm(userId);
          
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
            redirected.current = true;
            navigate(`/candidate?lang=${locale}`);
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
  }, []); // Удаляем navigate из зависимостей

  const handleStartTest = () => {
    // Проверяем, был ли уже выполнен редирект
    if (redirected.current) return;
    
    // Проверяем наличие данных перед началом тестирования
    if (!candidateData || (!candidateData.userId && !candidateData.employee_id)) {
      console.warn('Missing candidate data before starting test:', candidateData);
      redirected.current = true;
      navigate(`/candidate?lang=${locale}`);
      return;
    }
    
    const userId = candidateData.userId || candidateData.employee_id;
    console.log('Starting test with candidate data:', candidateData);
    
    // Проверяем наличие ID тестовой сессии
    if (candidateData.testSessionId) {
      console.log('Redirecting to existing test session:', candidateData.testSessionId);
      redirected.current = true;
      navigate(`/test-session/${candidateData.testSessionId}?lang=${locale}`);
    } else {
      // Если ID сессии нет, переходим к чату для создания новой сессии
      console.log('No test session ID found, redirecting to chat');
      redirected.current = true;
      navigate(`/chat?userId=${userId}&lang=${locale}`);
    }
  };

  // Отображаем индикатор загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">{t('loading')}</p>
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
              {t('errorTitle')}
            </h1>
            <p className="text-gray-400 mt-2 text-center">{error}</p>
          </div>
          <button
            onClick={() => navigate(`/candidate?lang=${locale}`)}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold rounded-lg transition duration-200"
          >
            {t('errorReturnForm')}
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
            {t('testInfoTitle')}
          </h1>
          <p className="text-gray-400 mt-2">
            {t('testInfoGreeting')}, {candidateData?.first_name || 'соискатель'}!
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-pink-500" />
              {t('testInfoPurposeTitle')}
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {t('testInfoPurposeText')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <Clock className="w-6 h-6 text-pink-500" />
              {t('testInfoConditionsTitle')}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>{t('testInfoDuration')}</li>
              <li>{t('testInfoQuestions')}</li>
              <li>{t('testInfoPassScore')}</li>
              <li>{t('testInfoNavigation')}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-200">{t('testInfoRulesTitle')}</h2>
            <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg p-4 space-y-2">
              <p className="text-gray-400">
                {t('testInfoRule1')}
              </p>
              <p className="text-gray-400">
                {t('testInfoRule2')}
              </p>
              <p className="text-gray-400">
                {t('testInfoRule3')}
              </p>
              <p className="text-gray-400">
                {t('testInfoRule4')}
              </p>
            </div>
          </section>

          <button
            onClick={handleStartTest}
            className="w-full p-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white text-lg font-bold rounded-lg transition duration-200 mt-8"
          >
            {t('testInfoStartTest')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TestInfo;