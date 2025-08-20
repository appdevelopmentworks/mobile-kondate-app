'use client';

import SettingsInitializer from './SettingsInitializer';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SettingsInitializer />
      {children}
    </>
  );
}
