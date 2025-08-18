'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'elevated';
}

export default function Card({
  children,
  className,
  onClick,
  selected = false,
  disabled = false,
  variant = 'default',
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200';
  
  const variants = {
    default: 'bg-white shadow-sm',
    bordered: 'bg-white border-2',
    elevated: 'bg-white shadow-lg',
  };
  
  const interactiveStyles = onClick ? 'cursor-pointer active:scale-95' : '';
  
  const selectedStyles = selected 
    ? 'border-primary-500 bg-primary-50 shadow-md' 
    : variant === 'bordered' 
    ? 'border-gray-200' 
    : '';
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <motion.div
      whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      className={cn(
        baseStyles,
        variants[variant],
        interactiveStyles,
        selectedStyles,
        disabledStyles,
        className
      )}
    >
      {children}
    </motion.div>
  );
}
