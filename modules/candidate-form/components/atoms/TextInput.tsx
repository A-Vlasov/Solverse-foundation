import React, { ChangeEvent } from 'react';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
}

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
        className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
          error 
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
        className={`w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-[#3d3d3d] focus:border-pink-500 focus:ring-pink-500'
        } text-gray-100 focus:ring-2 focus:border-transparent transition duration-200 outline-none`}
        placeholder={`${label}...`}
      />
    )}
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

export default TextInput; 