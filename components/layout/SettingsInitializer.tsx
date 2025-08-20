'use client';

import { useEffect } from 'react';
import { initializeSettings } from '@/lib/settings-store';

export default function SettingsInitializer() {
  useEffect(() => {
    // アプリ起動時に設定を初期化
    initializeSettings();
  }, []);

  return null; // このコンポーネントは何もレンダリングしない
}
