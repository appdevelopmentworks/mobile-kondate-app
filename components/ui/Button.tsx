'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseClasses = 'touch-target rounded-2xl font-semibold transition-all duration-200 active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl disabled:shadow-md',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl disabled:shadow-md',
    outline: 'border-2 border-pink-500 text-pink-500 bg-white/90 hover:bg-pink-50 disabled:border-gray-300 disabled:text-gray-400',
    ghost: 'text-pink-500 bg-transparent hover:bg-pink-50 disabled:text-gray-400',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </motion.button>
  );
}