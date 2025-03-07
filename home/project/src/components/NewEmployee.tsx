import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { createUser } from '../lib/supabase';

function NewEmployee() {
  const navigate = useNavigate();
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testLink, setTestLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Create user in Supabase
      const user = await createUser(formData.firstName, formData.lastName);
      console.log('User created successfully:', user);

      // Generate test link
      const token = Math.random().toString(36).substring(7) + Date.now().toString(36);
      const newLink = `${window.location.origin}/candidate`;
      setTestLink(newLink);
      setLinkGenerated(true);

      // Store candidate data in session storage
      sessionStorage.setItem('candidateData', JSON.stringify({
        ...formData,
        userId: user.id
      }));
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateLink = () => {
    const token = Math.random().toString(36).substring(7) + Date.now().toString(36);
    const newLink = `${window.location.origin}/candidate`;
    setTestLink(newLink);
    setLinkCopied(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(testLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleOpenLink = () => {
    navigate('/candidate');
  };

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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

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
                      className="flex-1 bg-transparent border-none focus:outline-none text-gray-400"
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
                      <button
                        onClick={handleRegenerateLink}
                        className="p-2 hover:bg-[#3d3d3d] rounded-lg transition-colors"
                        title="Сгенерировать новую ссылку"
                      >
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenLink}
                    className="w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Открыть анкету
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