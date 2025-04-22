import React from 'react';

type AuthStatusType = 'authenticated' | 'unauthenticated' | 'loading';

interface AuthStatusProps {
  status: AuthStatusType;
  className?: string;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ status, className = '' }) => {
  const statusConfig = {
    authenticated: {
      text: 'Авторизован',
      bgColor: 'bg-green-600',
      icon: (
        <svg
          className="w-4 h-4 fill-current"
          xmlns="http:
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      ),
    },
    unauthenticated: {
      text: 'Не авторизован',
      bgColor: 'bg-red-600',
      icon: (
        <svg
          className="w-4 h-4 fill-current"
          xmlns="http:
          viewBox="0 0 24 24"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
        </svg>
      ),
    },
    loading: {
      text: 'Проверка...',
      bgColor: 'bg-gray-600',
      icon: (
        <svg
          className="w-4 h-4 fill-current animate-spin"
          xmlns="http:
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
    },
  };

  const { text, bgColor, icon } = statusConfig[status];

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 text-white ${bgColor}`}
      >
        {icon}
        {text}
      </span>
    </div>
  );
};

export default AuthStatus; 