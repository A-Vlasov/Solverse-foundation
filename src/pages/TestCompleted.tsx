import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';
import { useSearchParams } from 'next/navigation';

export default function TestCompleted() {
  const { locale, setLocale, t } = useLocale();
  const searchParams = useSearchParams();
  
  // Устанавливаем локаль из URL параметра при загрузке страницы
  useEffect(() => {
    const langParam = searchParams?.get('lang');
    if (langParam && (langParam === 'en' || langParam === 'ru')) {
      setLocale(langParam);
    }
  }, [searchParams, setLocale]);
  
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#2d2d2d] rounded-2xl p-8 border border-[#3d3d3d] text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
          {t('testCompletedTitle')}
        </h1>
        
        <p className="text-gray-300 mb-8">
          {t('testCompletedMessage')}
        </p>
      </div>
    </div>
  );
}