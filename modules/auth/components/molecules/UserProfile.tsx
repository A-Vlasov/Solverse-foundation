import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthStatus from '../atoms/AuthStatus';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  if (!isAuthenticated || !user) {
    return null;
  }

  
  const getInitials = () => {
    if (!user.name) return '?';
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center text-white hover:text-gray-300 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2">
          {getInitials()}
        </div>
        <span className="mr-1">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http:
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-dark-2 rounded-md shadow-lg z-50 py-1">
          <div className="px-4 py-2 border-b border-dark-3">
            <div className="font-medium text-white">{user.name}</div>
            {user.telegram_id && (
              <div className="text-sm text-blue-400">@{user.telegram_id}</div>
            )}
            <div className="mt-1">
              <AuthStatus status="authenticated" />
            </div>
          </div>
          
          <div className="px-4 py-2">
            <button
              onClick={logout}
              className="flex items-center w-full text-left text-red-400 hover:text-red-300 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http:
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 