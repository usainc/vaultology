
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add any custom props if needed
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  const baseStyles =
    'block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return <input className={`${baseStyles} ${className}`} {...props} />;
};
