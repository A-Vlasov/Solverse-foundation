import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, FileText, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { saveCandidateForm } from '../lib/supabase';

function CandidateForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    telegram_tag: '',
    shift: '',
    experience: '',
    motivation: '',
    about_me: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
    console.log('Loading candidate data in CandidateForm:', savedData);
    
    if (savedData) {
      setFormData(prevData => ({
        ...prevData,
        first_name: savedData.first_name || prevData.first_name,
        telegram_tag: savedData.telegram_tag || prevData.telegram_tag,
        shift: savedData.shift || prevData.shift,
        experience: savedData.experience || prevData.experience,
        motivation: savedData.motivation || prevData.motivation,
        about_me: savedData.about_me || prevData.about_me
      }));
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Имя обязательно для заполнения';
    }

    if (!formData.telegram_tag.trim()) {
      newErrors.telegram_tag = 'Telegram тег обязателен для заполнения';
    } else if (!formData.telegram_tag.startsWith('@')) {
      newErrors.telegram_tag = 'Telegram тег должен начинаться с @';
    }

    if (!formData.shift) {
      newErrors.shift = 'Выберите смену';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Расскажите о вашем опыте';
    }

    if (!formData.motivation.trim()) {
      newErrors.motivation = 'Расскажите о вашей мотивации';
    }

    if (!formData.about_me.trim()) {
      newErrors.about_me = 'Расскажите о себе';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Сохраняем данные в базу
      const savedForm = await saveCandidateForm(formData);
      console.log('Form saved successfully:', savedForm);

      // Сохраняем данные в sessionStorage
      const existingData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
      const updatedData = {
        ...existingData,
        ...formData,
        formId: savedForm.id, // Сохраняем ID формы
        employeeId: savedForm.employee_id // Сохраняем ID сотрудника
      };
      
      sessionStorage.setItem('candidateData', JSON.stringify(updatedData));
      
      // Переходим к следующему шагу
      navigate('/test-info');
    } catch (error) {
      console.error('Error saving form:', error);
      setSubmitError(error instanceof Error ? error.message : 'Произошла ошибка при сохранении формы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
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
            <p className="text-gray-400 mt-2">Пожалуйста, заполните все поля анкеты</p>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-1">
                Имя <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                  errors.first_name ? 'border-red-500' : 'border-[#3d3d3d]'
                } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none`}
                placeholder="Введите ваше имя..."
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="telegram_tag" className="block text-sm font-medium text-gray-300 mb-1">
                Telegram тег <span className="text-red-500">*</span>
              </label>
              <input
                id="telegram_tag"
                name="telegram_tag"
                type="text"
                value={formData.telegram_tag}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                  errors.telegram_tag ? 'border-red-500' : 'border-[#3d3d3d]'
                } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none`}
                placeholder="Введите ваш тег в Telegram..."
              />
              {errors.telegram_tag && (
                <p className="mt-1 text-sm text-red-500">{errors.telegram_tag}</p>
              )}
            </div>

            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-300 mb-1">
                Номер смены <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'shift', value: 'night' } } as React.ChangeEvent<HTMLInputElement>)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                    formData.shift === 'night'
                      ? 'bg-pink-500 border-transparent text-white'
                      : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                  } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  #ночь 0-8
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'shift', value: 'day' } } as React.ChangeEvent<HTMLInputElement>)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                    formData.shift === 'day'
                      ? 'bg-pink-500 border-transparent text-white'
                      : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                  } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  #день 8-16
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'shift', value: 'evening' } } as React.ChangeEvent<HTMLInputElement>)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                    formData.shift === 'evening'
                      ? 'bg-pink-500 border-transparent text-white'
                      : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                  } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  #вечер 16-0
                </button>
              </div>
              {errors.shift && (
                <p className="mt-1 text-sm text-red-500">{errors.shift}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-1">
                Опыт <span className="text-red-500">*</span>
              </label>
              <textarea
                id="experience"
                name="experience"
                rows={3}
                value={formData.experience}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                  errors.experience ? 'border-red-500' : 'border-[#3d3d3d]'
                } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder="Расскажите о вашем опыте работы..."
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-500">{errors.experience}</p>
              )}
            </div>

            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-gray-300 mb-1">
                Почему решил попасть к нам <span className="text-red-500">*</span>
              </label>
              <textarea
                id="motivation"
                name="motivation"
                rows={3}
                value={formData.motivation}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                  errors.motivation ? 'border-red-500' : 'border-[#3d3d3d]'
                } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder="Опишите вашу мотивацию..."
              />
              {errors.motivation && (
                <p className="mt-1 text-sm text-red-500">{errors.motivation}</p>
              )}
            </div>

            <div>
              <label htmlFor="about_me" className="block text-sm font-medium text-gray-300 mb-1">
                В целом расскажи о себе <span className="text-red-500">*</span>
              </label>
              <textarea
                id="about_me"
                name="about_me"
                rows={4}
                value={formData.about_me}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
                  errors.about_me ? 'border-red-500' : 'border-[#3d3d3d]'
                } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder="Расскажите о себе..."
              />
              {errors.about_me && (
                <p className="mt-1 text-sm text-red-500">{errors.about_me}</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg text-white font-semibold transition duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Далее
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateForm;