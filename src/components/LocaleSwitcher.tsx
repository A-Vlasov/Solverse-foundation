import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { availableLocales } from '../locales';

interface LocaleSwitcherProps {
  className?: string;
}

const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`flex items-center ${className}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'en' | 'ru')}
        className="bg-[#2d2d2d] text-white border border-[#3d3d3d] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
      >
        {availableLocales.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocaleSwitcher; 