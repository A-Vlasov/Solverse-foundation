import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  block?: boolean;
  className?: string;
}

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

export default Button; 