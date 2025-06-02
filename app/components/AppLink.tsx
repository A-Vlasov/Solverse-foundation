'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AppLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

/**
 * Универсальный компонент для ссылок, который корректно работает в Next.js
 * и при этом правильно обрабатывает клики через React Router context
 */
export default function AppLink({
  href,
  children,
  className = '',
  onClick,
  prefetch = false,
}: AppLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }

    // Если ссылка внешняя или ссылка на API, используем стандартное поведение
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('/api') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return; // Позволяем стандартное поведение браузера
    }

    // Для внутренних ссылок используем программную навигацию
    e.preventDefault();
    router.push(href);
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
} 