import React from 'react';

export default function Button({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  type = 'button',
  variant = 'primary'
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-60',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60',
    success: 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-60',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
