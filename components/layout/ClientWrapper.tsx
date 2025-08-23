'use client';

import SettingsInitializer from './SettingsInitializer';
import ErrorBoundary from '../ui/ErrorBoundary';
import { ToastContainer } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <SettingsInitializer />
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}
    </ErrorBoundary>
  );
}
