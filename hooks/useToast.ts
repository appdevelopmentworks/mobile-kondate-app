'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

export interface UseToastReturn {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearAll,
  };
}