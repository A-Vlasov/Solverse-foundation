import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, FileText, ArrowRight } from 'lucide-react';

function CandidateForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    aboutMe: '',
    questions: {
      experience: '',
      education: '',
      skills: '',
      motivation: '',
      expectations: '',
      availability: '',
      relocation: ''
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    console.log('Loading candidate data in CandidateForm:', savedData);
    
    if (savedData) {
      // Проверяем наличие обязательных полей
      if (!savedData.firstName || !savedData.lastName) {
        console.warn('Missing required fields in candidateData:', savedData);
      }
      
      setFormData(prevData => ({
        ...prevData,
        firstName: savedData.firstName || prevData.firstName,
        lastName: savedData.lastName || prevData.lastName,
        aboutMe: savedData.aboutMe || prevData.aboutMe,
        questions: {
          ...prevData.questions,
          ...(savedData.questions || {})
        }
      }));
    }
  }, []);

  const handleNext = () => {
    // Получаем существующие данные из sessionStorage
    const existingData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    console.log('Existing candidate data:', existingData);
    
    // Проверяем наличие userId
    if (!existingData.userId) {
      console.warn('Missing userId in existing data');
    }
    
    // Объединяем существующие данные с данными формы
    const updatedData = {
      ...existingData,
      ...formData,
      // Если firstName и lastName были изменены в форме, обновляем их
      firstName: formData.firstName || existingData.firstName,
      lastName: formData.lastName || existingData.lastName
    };
    
    console.log('Saving updated candidate data:', updatedData);
    
    // Сохраняем обновленные данные в sessionStorage
    sessionStorage.setItem('candidateData', JSON.stringify(updatedData));
    
    navigate('/test-info');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('q_')) {
      setFormData(prev => ({
        ...prev,
        questions: {
          ...prev.questions,
          [name.replace('q_', '')]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#2d2d2d] rounded-2xl shadow-xl p-8 border border-[#3d3d3d]">
          <div className="flex flex-col items-center mb-8">
            <UserCircle className="w-20 h-20 text-pink-500 mb-4" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              Анкета соискателя
            </h1>
            <p className="text-gray-400 mt-2">Пожалуйста, ответьте на все вопросы анкеты</p>
          </div>

          <div className="mb-8">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3d3d3d]">
              <h2 className="text-lg font-semibold text-gray-300 mb-2">Информация о кандидате</h2>
              <p className="text-gray-400">
                {formData.lastName} {formData.firstName}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-300 mb-1">
              Расскажите о себе
            </label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              rows={4}
              value={formData.aboutMe}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              placeholder="Кратко опишите ваш профессиональный опыт, навыки и личные качества..."
            />
          </div>

          <div className="space-y-6 mt-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-gray-200">Вопросы анкеты</h2>
            </div>

            <div>
              <label htmlFor="q_experience" className="block text-sm font-medium text-gray-300 mb-1">
                1. Какие основные правила общения и поведения должны соблюдаться на OnlyFans, и как вы будете их обеспечивать?
              </label>
              <textarea
                id="q_experience"
                name="q_experience"
                rows={3}
                value={formData.questions.experience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_education" className="block text-sm font-medium text-gray-300 mb-1">
                2. Как бы вы завели разговор с новым пользователем, чтобы понять, готов ли он платить за контент?
              </label>
              <textarea
                id="q_education"
                name="q_education"
                rows={3}
                value={formData.questions.education}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_skills" className="block text-sm font-medium text-gray-300 mb-1">
                3. Какой вопрос вы бы задали, чтобы сразу определить, серьёзен ли человек или просто хочет пообщаться бесплатно?
              </label>
              <textarea
                id="q_skills"
                name="q_skills"
                rows={3}
                value={formData.questions.skills}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_motivation" className="block text-sm font-medium text-gray-300 mb-1">
                4. Как бы вы убедили сомневающегося пользователя оформить подписку?
              </label>
              <textarea
                id="q_motivation"
                name="q_motivation"
                rows={3}
                value={formData.questions.motivation}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_expectations" className="block text-sm font-medium text-gray-300 mb-1">
                5. Как бы вы отреагировали на просьбу о скидке или бесплатном доступе "на пробу"?
              </label>
              <textarea
                id="q_expectations"
                name="q_expectations"
                rows={3}
                value={formData.questions.expectations}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_availability" className="block text-sm font-medium text-gray-300 mb-1">
                6. Как бы вы действовали, если кто-то предложит перевести деньги за контент вне платформы?
              </label>
              <textarea
                id="q_availability"
                name="q_availability"
                rows={3}
                value={formData.questions.availability}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="q_relocation" className="block text-sm font-medium text-gray-300 mb-1">
                7. Как объяснить разницу между бесплатным и платным контентом, не отпугнув клиента?
              </label>
              <textarea
                id="q_relocation"
                name="q_relocation"
                rows={3}
                value={formData.questions.relocation}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#3d3d3d] text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-4 rounded-lg text-white font-semibold transition duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90"
            >
              <ArrowRight className="w-5 h-5" />
              Далее
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateForm;