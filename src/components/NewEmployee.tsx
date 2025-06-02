import React, { useState } from 'react';
import { useNavigation } from '../../app/components/SimpleNavigation';
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  Share2
} from 'lucide-react';

function NewEmployee() {
  const { navigate } = useNavigation();
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showOnlyLink, setShowOnlyLink] = useState(false);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testLink, setTestLink] = useState('');
  const [candidateToken, setCandidateToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Используем API-маршрут вместо прямого обращения к базе данных
      const response = await fetch('/api/employees/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: '',
          department: 'Candidates',
          level: 'Junior',
          status: 'Active'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании сотрудника');
      }
      
      const data = await response.json();
      console.log('Employee created successfully:', data);
      
      // Используем ссылку и токен из ответа API
      const employee = data.employee;
      const token = data.token;
      
      // Формируем полную ссылку (включая origin)
      const newLink = `${window.location.origin}/candidate?token=${token}`;
      setTestLink(newLink);
      setCandidateToken(token);
      setLinkGenerated(true);

      // Store candidate data in session storage
      const candidateData = {
        userId: employee.id,
        startDate: formData.startDate,
        token: token
      };
      console.log('Saving candidate data to sessionStorage:', candidateData);
      
      // Полный сброс всех данных сессии
      console.log('Resetting all session data for new candidate');
      
      // Удаляем ID сессии и все связанные с чатом данные
      sessionStorage.removeItem('currentTestSessionId');
      
      // Очищаем локальное состояние для нового соискателя
      localStorage.removeItem('chatHistories');
      localStorage.removeItem('userStatus');
      
      // Сохраняем только новые данные соискателя
      sessionStorage.setItem('candidateData', JSON.stringify(candidateData));
      
      console.log('Session data reset completed, only new candidate data preserved');
      
      // Сразу открываем интерфейс только со ссылкой
      setShowOnlyLink(true);
    } catch (err) {
      console.error('Error creating employee:', err);
      setError('Ошибка при создании профиля сотрудника. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    try {
      // Современный метод копирования в буфер обмена
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(testLink)
          .then(() => {
            console.log('Ссылка успешно скопирована в буфер обмена');
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          })
          .catch(err => {
            console.error('Ошибка при копировании через Clipboard API:', err);
            fallbackCopyMethod();
          });
      } else {
        // Резервный метод, если Clipboard API недоступен
        fallbackCopyMethod();
      }
    } catch (err) {
      console.error('Ошибка при копировании ссылки:', err);
      fallbackCopyMethod();
    }
  };

  // Резервный метод копирования с использованием document.execCommand
  const fallbackCopyMethod = () => {
    try {
      // Создаем временный элемент input
      const textArea = document.createElement('textarea');
      textArea.value = testLink;
      
      // Делаем элемент невидимым
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Выделяем и копируем текст
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('Ссылка успешно скопирована (резервный метод)');
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } else {
        console.error('Не удалось скопировать ссылку (резервный метод)');
        alert('Не удалось скопировать ссылку автоматически. Пожалуйста, выделите и скопируйте её вручную.');
      }
      
      // Удаляем временный элемент
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Ошибка при копировании (резервный метод):', err);
      alert('Не удалось скопировать ссылку. Пожалуйста, выделите и скопируйте её вручную.');
    }
  };

  const handleShowOnlyLink = () => {
    setShowOnlyLink(true);
  };

  const handleCloseOnlyLink = () => {
    // При закрытии окна со ссылкой перенаправляем на дашборд
    navigate('/admin');
  };

  // Режим отображения только ссылки
  if (showOnlyLink && testLink) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl bg-[#2d2d2d] rounded-xl p-6 relative">
          <button 
            onClick={handleCloseOnlyLink}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#1a1a1a] hover:bg-[#3d3d3d] transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Ссылка для соискателя</h2>
            <p className="text-gray-400 mt-2">Скопируйте эту ссылку и отправьте соискателю</p>
          </div>
          
          <div className="bg-[#1a1a1a] p-6 rounded-lg border-2 border-pink-500 mb-6">
            <p className="text-gray-200 break-all text-center font-mono">{testLink}</p>
          </div>
          
          <button
            onClick={handleCopyLink}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {linkCopied ? (
              <>
                <CheckCircle className="w-6 h-6" />
                Скопировано!
              </>
            ) : (
              <>
                <Copy className="w-6 h-6" />
                Копировать ссылку
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Новый соискатель
          </h1>
          <p className="text-gray-400 mt-1">Создание профиля и генерация ссылки на тестирование</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-6 h-6 text-pink-500" />
              <h2 className="text-xl font-semibold">Данные соискателя</h2>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Дата начала тестирования
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold transition-opacity ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
              >
                {isSubmitting ? 'Создание...' : 'Зарегистрировать и создать ссылку'}
              </button>
            </form>
          </div>

          {/* Link Section */}
          {linkGenerated && (
            <div className="bg-[#2d2d2d] rounded-2xl p-6 border border-[#3d3d3d]">
              <div className="flex items-center gap-3 mb-6">
                <LinkIcon className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-semibold">Ссылка на тестирование</h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#3d3d3d]">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={testLink}
                      readOnly
                      className="flex-1 bg-transparent border-none focus:outline-none text-gray-400 overflow-x-auto"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="p-2 hover:bg-[#3d3d3d] rounded-lg transition-colors"
                        title="Копировать ссылку"
                      >
                        {linkCopied ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleShowOnlyLink}
                    className="w-full py-2 mt-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Показать только ссылку
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-300">Инструкции:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-400">
                    <li>Скопируйте сгенерированную ссылку</li>
                    <li>Отправьте ссылку соискателю</li>
                    <li>Соискатель должен перейти по ссылке для начала тестирования</li>
                    <li>После завершения тестирования результаты будут доступны в панели управления</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewEmployee;