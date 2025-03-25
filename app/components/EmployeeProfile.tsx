import React from 'react';
import { getEmployee, getTestResultsForEmployee, getCandidateFormByEmployeeId } from '../../src/lib/supabase';

// Функция для загрузки данных сотрудника с сервера
async function getEmployeeData(id: string) {
  // Получаем данные о сотруднике
  const employee = await getEmployee(id);
  
  if (!employee) {
    throw new Error('Сотрудник не найден');
  }
  
  // Получаем результаты тестов для сотрудника
  const testResults = await getTestResultsForEmployee(id);
  
  // Получаем данные формы кандидата
  const candidateForm = await getCandidateFormByEmployeeId(id);
  
  // Формируем итоговый профиль
  const profile = {
    ...employee,
    test_results: testResults || [],
    candidate_form: candidateForm || null
  };
  
  return profile;
}

// Компонент для отображения профиля сотрудника
export default async function EmployeeProfile({ id }: { id: string }) {
  // Получаем данные сотрудника
  const profile = await getEmployeeData(id);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">{profile.first_name}</h1>
      
      {/* Информация о сотруднике */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Информация о сотруднике</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Отдел:</div>
          <div>{profile.department || 'Не указан'}</div>
          
          <div className="font-medium">Уровень:</div>
          <div>{profile.level || 'Не указан'}</div>
          
          <div className="font-medium">Статус:</div>
          <div>
            <span className={`px-2 py-1 rounded-full text-xs ${
              profile.status === 'active' ? 'bg-green-100 text-green-800' :
              profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {profile.status === 'active' ? 'Активен' :
               profile.status === 'pending' ? 'В ожидании' :
               profile.status || 'Не указан'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Информация о форме кандидата */}
      {profile.candidate_form && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Анкета кандидата</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Telegram:</div>
            <div>{profile.candidate_form.telegram_tag || 'Не указан'}</div>
            
            <div className="font-medium">Опыт работы:</div>
            <div>{profile.candidate_form.experience || 'Не указан'}</div>
            
            <div className="font-medium">Смена:</div>
            <div>{profile.candidate_form.shift || 'Не указана'}</div>
            
            <div className="font-medium">Мотивация:</div>
            <div className="col-span-2 mt-1">
              <p className="text-sm text-gray-700">{profile.candidate_form.motivation || 'Не указана'}</p>
            </div>
            
            <div className="font-medium">О себе:</div>
            <div className="col-span-2 mt-1">
              <p className="text-sm text-gray-700">{profile.candidate_form.about_me || 'Не указано'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Результаты тестов */}
      {profile.test_results && profile.test_results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Результаты тестов</h2>
          <div className="space-y-4">
            {profile.test_results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium mb-2">
                  Тест от {result.created_at ? new Date(result.created_at).toLocaleDateString() : 'неизвестной даты'}
                </div>
                
                {result.analysis_result && result.analysis_result.dialog_analysis && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Вовлеченность:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.engagement.score} / 5</div>
                    
                    <div className="font-medium">Общение и тон:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.charm_and_tone.score} / 5</div>
                    
                    <div className="font-medium">Креативность:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.creativity.score} / 5</div>
                    
                    <div className="font-medium">Адаптивность:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.adaptability.score} / 5</div>
                    
                    <div className="font-medium">Самопродвижение:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.self_promotion.score} / 5</div>
                    
                    <div className="font-medium">Ценовая политика:</div>
                    <div>{result.analysis_result.dialog_analysis.metrics.pricing_policy.score} / 5</div>
                    
                    <div className="font-medium col-span-2 mt-2">Заключение:</div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {result.analysis_result.dialog_analysis.overall_conclusion}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-sm">
                  <a href={`/test-results/${result.test_session_id}`} className="text-blue-600 hover:underline">
                    Посмотреть подробности
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 