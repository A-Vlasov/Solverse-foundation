import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useLocation, useParams, navigate } from '../../app/components/SimpleNavigation';
import { UserCircle, FileText, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { saveCandidateForm, validateCandidateToken, getEmployee, getCandidateForm } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';
import { t as translate } from '../locales';

// Типы для внутренних компонентов
interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  block?: boolean;
  className?: string;
}

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
}

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
}

interface MessageProps {
  type?: 'error' | 'success' | 'info';
  message: string;
}

// Внутренний компонент кнопки
const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  onClick,
  disabled = false,
  block = false,
  className = ''
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`font-semibold rounded-lg transition-opacity bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 py-3 px-5 focus:outline-none ${block ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

// Внутренний компонент для текстовых полей
const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  error = ''
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={4}
        className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-[#3d3d3d] focus:border-pink-500 focus:ring-pink-500'
          } text-gray-100 focus:ring-2 focus:border-transparent transition duration-200 outline-none resize-none`}
        placeholder={`${label}...`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${error
          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
          : 'border-[#3d3d3d] focus:border-pink-500 focus:ring-pink-500'
          } text-gray-100 focus:ring-2 focus:border-transparent transition duration-200 outline-none`}
        placeholder={`${label}...`}
      />
    )}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// Внутренний компонент формы
const Form: React.FC<FormProps> = ({ children, onSubmit }) => (
  <form className="space-y-6" onSubmit={onSubmit}>
    {children}
  </form>
);

// Внутренний компонент загрузки
const Loader: React.FC<LoaderProps> = ({ size = 'medium' }) => {
  const sizeClass =
    size === 'small' ? 'w-4 h-4 border-2' :
      size === 'large' ? 'w-12 h-12 border-4' :
        'w-8 h-8 border-2';

  return (
    <div className={`${sizeClass} border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`} />
  );
};

// Внутренний компонент сообщения об ошибке
const Message: React.FC<MessageProps> = ({ type = 'error', message }) => (
  <div className={`p-4 rounded-lg border flex items-center gap-2 ${type === 'error'
    ? 'bg-red-500/10 border-red-500/20 text-red-400'
    : type === 'success'
      ? 'bg-green-500/10 border-green-500/20 text-green-400'
      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    }`}>
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <p>{message}</p>
  </div>
);

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
  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Используем ref для отслеживания, был ли уже выполнен редирект
  const redirected = useRef(false);

  // Убираем хук навигации, используем прямую функцию
  const location = useLocation();
  const params = useParams();
  const { locale, setLocale } = useLocale();

  // Создаем функцию-обёртку для переводов, которая автоматически использует текущую локаль
  const t = (key: string) => translate(key, locale as any);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const langParam = params.lang || urlParams.get('lang');

    if (langParam && (langParam === 'en' || langParam === 'ru')) {
      setLocale(langParam);
    }

    async function validateToken() {
      try {
        setIsLoading(true);
        setTokenError(null);

        // Получаем токен из параметров URL
        const token = params.token || urlParams.get('token');

        if (!token) {
          setTokenError(t('candidateForm.errors.missingToken'));
          setIsLoading(false);
          return;
        }

        console.log('Token from URL:', token);

        // Проверяем токен
        const result = await validateCandidateToken(token);

        if (!result.success) {
          // Обрабатываем различные коды ошибок
          switch (result.errorCode) {
            case 'ALREADY_USED':
              // Если токен был уже использован, но у нас есть ID сотрудника, проверяем данные в sessionStorage
              if (result.employeeId) {
                const savedCandidateData = sessionStorage.getItem('candidateData');
                const savedToken = sessionStorage.getItem('lastUsedToken');

                // Если сохраненный токен не совпадает с текущим, значит это новый токен
                // И мы должны позволить пользователю продолжить, даже если токен отмечен как использованный
                if (savedToken && savedToken !== token) {
                  console.log('New token detected for existing employee:', result.employeeId);

                  // Сохраняем новый токен и ID сотрудника
                  sessionStorage.setItem('employeeId', result.employeeId);
                  sessionStorage.setItem('lastUsedToken', token);

                  // Обновляем или создаем candidateData для нового токена
                  const updatedCandidateData = savedCandidateData
                    ? JSON.parse(savedCandidateData)
                    : {};

                  sessionStorage.setItem('candidateData', JSON.stringify({
                    ...updatedCandidateData,
                    employee_id: result.employeeId,
                    userId: result.employeeId, // Добавляем userId для совместимости
                    token: token
                  }));

                  // Проверяем, заполнял ли этот сотрудник уже форму
                  if (updatedCandidateData.employee_id === result.employeeId && updatedCandidateData.form_completed) {
                    navigate(`/test-info?lang=${locale}`);
                    return;
                  }

                  setIsLoading(false);
                  return;
                }

                if (savedCandidateData) {
                  try {
                    // Если у нас есть данные в sessionStorage, проверяем, заполнена ли форма
                    const candidateData = JSON.parse(savedCandidateData);

                    if (candidateData.employee_id === result.employeeId && candidateData.form_completed) {
                      // Форма уже заполнена, перенаправляем на страницу информации о тесте
                      navigate(`/test-info?lang=${locale}`);
                      return;
                    }

                    // Если форма не заполнена, разрешаем продолжить с этим токеном
                    sessionStorage.setItem('employeeId', result.employeeId);
                    sessionStorage.setItem('lastUsedToken', token);
                    setIsLoading(false);
                    return;
                  } catch (e) {
                    console.error('Error parsing session data:', e);
                  }
                }

                // Если нет данных в sessionStorage или они повреждены, показываем ошибку
                setTokenError(t('candidateForm.errors.tokenAlreadyUsed'));
              } else {
                setTokenError(t('candidateForm.errors.tokenAlreadyUsed'));
              }
              break;
            case 'EXPIRED':
              setTokenError(t('candidateForm.errors.tokenExpired'));
              break;
            case 'NOT_FOUND':
            case 'INVALID_FORMAT':
              setTokenError(t('candidateForm.errors.invalidToken'));
              break;
            default:
              setTokenError(t('candidateForm.errors.unexpectedError'));
          }

          setIsLoading(false);
          return;
        }

        // Токен валиден, сохраняем ID сотрудника
        const employeeId = result.employeeId;

        if (!employeeId) {
          setTokenError(t('candidateForm.errors.missingEmployeeId'));
          setIsLoading(false);
          return;
        }

        // Сохраняем текущий токен для дальнейших проверок
        sessionStorage.setItem('lastUsedToken', token);

        // Проверяем, заполнил ли уже кандидат форму
        const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');

        if (candidateData && candidateData.form_completed) {
          // Форма уже заполнена, перенаправляем на страницу информации о тесте
          navigate(`/test-info?lang=${locale}`);
          return;
        }

        // Сохраняем ID сотрудника в sessionStorage
        sessionStorage.setItem('employeeId', employeeId);
        sessionStorage.setItem('candidateData', JSON.stringify({
          employee_id: employeeId,
          userId: employeeId, // Добавляем userId для совместимости с TestInfo
          token: token,
          form_completed: false
        }));

        setIsLoading(false);
      } catch (error) {
        console.error('Error validating token:', error);
        setTokenError(t('candidateForm.errors.unexpectedError'));
        setIsLoading(false);
      }
    }

    validateToken();
  }, [locale]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('candidateForm.errors.requiredField');
    }

    if (!formData.telegram_tag.trim()) {
      newErrors.telegram_tag = t('candidateForm.errors.requiredField');
    } else if (!formData.telegram_tag.startsWith('@')) {
      newErrors.telegram_tag = t('candidateForm.errors.telegramFormat');
    }

    if (!formData.shift) {
      newErrors.shift = t('candidateForm.errors.selectShift');
    }

    if (!formData.experience.trim()) {
      newErrors.experience = t('candidateForm.errors.requiredField');
    }

    if (!formData.motivation.trim()) {
      newErrors.motivation = t('candidateForm.errors.requiredField');
    }

    if (!formData.about_me.trim()) {
      newErrors.about_me = t('candidateForm.errors.requiredField');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Проверяем валидность формы
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const employeeId = sessionStorage.getItem('employeeId');
      const currentToken = sessionStorage.getItem('lastUsedToken');

      if (!employeeId) {
        setSubmitError(t('candidateForm.errors.missingEmployeeId'));
        setIsSubmitting(false);
        return;
      }

      // Сохраняем данные формы
      const formInput = {
        employee_id: employeeId,
        ...formData
      };

      // Сохраняем данные в sessionStorage вместе с токеном
      const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
      sessionStorage.setItem('candidateData', JSON.stringify({
        ...candidateData,
        ...formData,
        employee_id: employeeId,
        userId: employeeId, // Добавляем userId для совместимости с TestInfo
        token: currentToken, // Сохраняем текущий токен
        form_completed: true
      }));

      // Сохраняем данные в базу данных
      await saveCandidateForm(formInput);

      // Перенаправляем на страницу информации о тесте
      navigate(`/test-info?lang=${locale}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(t('candidateForm.errors.submissionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Отображаем индикатор загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">{t('candidateForm.loading')}</p>
        </div>
      </div>
    );
  }

  // Отображаем ошибку токена, если она есть
  if (tokenError) {
    const isTokenAlreadyUsed = tokenError === t('candidateForm.errors.tokenAlreadyUsed');

    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
        <div className="max-w-md w-full bg-[#2d2d2d] rounded-2xl shadow-xl p-8 border border-[#3d3d3d] text-center">
          <div className="flex flex-col items-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-white text-center">
              {isTokenAlreadyUsed ? t('candidateForm.accessError') : t('candidateForm.errorTitle')}
            </h1>
            <p className="text-gray-400 mt-2 text-center">{tokenError}</p>
          </div>

          <div className="flex flex-col gap-3">
            {isTokenAlreadyUsed && (
              <button
                onClick={() => {
                  // Убедимся, что у нас есть employeeId и данные кандидата содержат userId
                  const employeeId = sessionStorage.getItem('employeeId');
                  if (employeeId) {
                    // Обновляем данные, чтобы убедиться, что userId присутствует
                    const candidateData = JSON.parse(sessionStorage.getItem('candidateData') || '{}');
                    if (!candidateData.userId) {
                      candidateData.userId = employeeId;
                      sessionStorage.setItem('candidateData', JSON.stringify(candidateData));
                    }
                  }

                  navigate(`/test-info?lang=${locale}`);
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
              >
                {t('candidateForm.goToTestInfo')}
              </button>
            )}
            <button
              onClick={() => {
                // Очищаем данные о текущем токене, чтобы при повторной попытке не было проблем
                if (isTokenAlreadyUsed) {
                  sessionStorage.removeItem('lastUsedToken');
                }
                window.location.reload();
              }}
              className={`w-full py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity ${isTokenAlreadyUsed
                ? 'bg-[#2d2d2d] border border-[#3d3d3d] text-white hover:bg-[#3a3a3a]'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                }`}
            >
              {t('candidateForm.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#2d2d2d] rounded-2xl shadow-xl p-8 border border-[#3d3d3d]">
          <div className="flex flex-col items-center mb-8 text-center">
            <UserCircle className="w-20 h-20 text-pink-500 mb-4" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              {t('candidateForm.title')}
            </h1>
            <p className="text-gray-400 mt-2">{t('candidateForm.subtitle')}</p>
          </div>

          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.name')} <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${errors.first_name ? 'border-red-500' : 'border-[#3d3d3d]'
                  } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none`}
                placeholder={`${t('candidateForm.fields.name')}...`}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="telegram_tag" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.telegram')} <span className="text-red-500">*</span>
              </label>
              <input
                id="telegram_tag"
                name="telegram_tag"
                type="text"
                value={formData.telegram_tag}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${errors.telegram_tag ? 'border-red-500' : 'border-[#3d3d3d]'
                  } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none`}
                placeholder={`${t('candidateForm.fields.telegram')}...`}
              />
              {errors.telegram_tag && (
                <p className="mt-1 text-sm text-red-500">{errors.telegram_tag}</p>
              )}
            </div>

            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.shift')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, shift: 'night' }))}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${formData.shift === 'night'
                    ? 'bg-pink-500 border-transparent text-white'
                    : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                    } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  {t('candidateForm.shifts.night')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, shift: 'day' }))}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${formData.shift === 'day'
                    ? 'bg-pink-500 border-transparent text-white'
                    : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                    } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  {t('candidateForm.shifts.day')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, shift: 'evening' }))}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${formData.shift === 'evening'
                    ? 'bg-pink-500 border-transparent text-white'
                    : errors.shift
                      ? 'bg-[#1a1a1a] border-red-500 text-gray-300 hover:bg-[#2d2d2d]'
                      : 'bg-[#1a1a1a] border-[#3d3d3d] text-gray-300 hover:bg-[#2d2d2d]'
                    } transition duration-200`}
                >
                  <Clock className="w-4 h-4" />
                  {t('candidateForm.shifts.evening')}
                </button>
              </div>
              {errors.shift && (
                <p className="mt-1 text-sm text-red-500">{errors.shift}</p>
              )}
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.experience')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="experience"
                name="experience"
                rows={3}
                value={formData.experience}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${errors.experience ? 'border-red-500' : 'border-[#3d3d3d]'
                  } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder={`${t('candidateForm.fields.experience')}...`}
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-500">{errors.experience}</p>
              )}
            </div>

            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.motivation')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="motivation"
                name="motivation"
                rows={3}
                value={formData.motivation}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${errors.motivation ? 'border-red-500' : 'border-[#3d3d3d]'
                  } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder={`${t('candidateForm.fields.motivation')}...`}
              />
              {errors.motivation && (
                <p className="mt-1 text-sm text-red-500">{errors.motivation}</p>
              )}
            </div>

            <div>
              <label htmlFor="about_me" className="block text-sm font-medium text-gray-300 mb-1">
                {t('candidateForm.fields.aboutMe')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="about_me"
                name="about_me"
                rows={4}
                value={formData.about_me}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${errors.about_me ? 'border-red-500' : 'border-[#3d3d3d]'
                  } text-gray-100 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition duration-200 outline-none resize-none`}
                placeholder={`${t('candidateForm.fields.aboutMe')}...`}
              />
              {errors.about_me && (
                <p className="mt-1 text-sm text-red-500">{errors.about_me}</p>
              )}
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg text-white font-semibold transition duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('candidateForm.submitting')}
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    {t('candidateForm.submit')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CandidateForm;