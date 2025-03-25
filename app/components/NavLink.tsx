'use client';

import React, { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Надежный компонент для навигации, который работает напрямую через window.location
 * В отличие от других подходов, этот компонент гарантированно вызовет переход по ссылке
 */
export default function NavLink({
  href,
  children,
  className = '',
  onClick,
}: NavLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Вызываем дополнительный обработчик, если он предоставлен
    if (onClick) {
      onClick();
    }
    
    // Прямая навигация через window.location
    window.location.href = href;
  };

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
} 