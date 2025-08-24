import { create } from 'zustand';

interface AppSettings {
  // UI設定
  darkMode: boolean;
  notifications: boolean;
  language: string;
  
  // 機能設定
  offlineMode: boolean;
  autoSave: boolean;
  defaultServings: number;
  defaultCookingTime: string;
  
  // プライバシー設定
  analyticsEnabled: boolean;
  dataSharingEnabled: boolean;
}

interface SettingsState extends AppSettings {
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleNotifications: () => void;
  toggleDarkMode: () => void;
  toggleOfflineMode: () => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  loadSettings: () => void;
  saveSettings: () => void;
}

const defaultSettings: AppSettings = {
  // UI設定
  darkMode: false,
  notifications: true,
  language: 'ja',
  
  // 機能設定
  offlineMode: true,
  autoSave: true,
  defaultServings: 2,
  defaultCookingTime: '30',
  
  // プライバシー設定
  analyticsEnabled: false,
  dataSharingEnabled: false,
};

// ローカルストレージのキー
const STORAGE_KEY = 'mobile-kondate-settings';

// ローカルストレージから設定を読み込み
const loadFromStorage = (): Partial<AppSettings> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('🔧 設定ストア: LocalStorageから読み込み', { stored });
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('🔧 設定ストア: パース済み設定', {
        defaultServings: parsed.defaultServings,
        defaultCookingTime: parsed.defaultCookingTime,
        全体: parsed
      });
      return parsed;
    }
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
  }
  return {};
};

// ローカルストレージに設定を保存
const saveToStorage = (settings: AppSettings) => {
  if (typeof window === 'undefined') {
    console.log('🔧 設定保存: window未定義のためスキップ');
    return;
  }
  
  try {
    const jsonString = JSON.stringify(settings);
    console.log('🔧 設定保存: LocalStorageに保存開始', {
      キー: STORAGE_KEY,
      保存データ: {
        defaultServings: settings.defaultServings,
        defaultCookingTime: settings.defaultCookingTime,
        全体: settings
      },
      JSON文字列長: jsonString.length
    });
    
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    // 保存確認
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedParsed = saved ? JSON.parse(saved) : null;
    console.log('🔧 設定保存: 保存確認', {
      保存成功: !!saved,
      保存されたdefaultServings: savedParsed?.defaultServings,
      保存されたdefaultCookingTime: savedParsed?.defaultCookingTime
    });
    
  } catch (error) {
    console.error('🔧 設定の保存エラー:', error);
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  // 初期設定（ストレージから読み込み + デフォルト設定）
  const storedSettings = loadFromStorage();
  const initialSettings = { ...defaultSettings, ...storedSettings };
  
  console.log('🔧 設定ストア: 初期化', {
    デフォルト設定: defaultSettings,
    保存済み設定: storedSettings,
    最終設定: initialSettings
  });
  
  return {
    ...initialSettings,
    
    updateSettings: (newSettings: Partial<AppSettings>) => {
      console.log('🔧 設定ストア: 設定更新', newSettings);
      set((state) => {
        const updatedState = { ...state, ...newSettings };
        console.log('🔧 設定ストア: 更新後の状態', {
          defaultServings: updatedState.defaultServings,
          defaultCookingTime: updatedState.defaultCookingTime,
          全体: updatedState
        });
        saveToStorage(updatedState);
        return updatedState;
      });
    },
    
    toggleNotifications: () => {
      console.log('設定ストア: 通知設定トグル');
      set((state) => {
        const newState = { ...state, notifications: !state.notifications };
        saveToStorage(newState);
        return newState;
      });
    },
    
    toggleDarkMode: () => {
      console.log('設定ストア: ダークモードトグル');
      set((state) => {
        const newDarkMode = !state.darkMode;
        const newState = { ...state, darkMode: newDarkMode };
        saveToStorage(newState);
        
        // DOM操作でダークモードを適用
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          if (newDarkMode) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
        
        return newState;
      });
    },
    
    toggleOfflineMode: () => {
      console.log('設定ストア: オフラインモードトグル');
      set((state) => {
        const newState = { ...state, offlineMode: !state.offlineMode };
        saveToStorage(newState);
        return newState;
      });
    },
    
    resetSettings: () => {
      console.log('設定ストア: 設定リセット');
      set(() => {
        saveToStorage(defaultSettings);
        // ダークモードもリセット
        if (typeof window !== 'undefined') {
          window.document.documentElement.classList.remove('dark');
        }
        return defaultSettings;
      });
    },
    
    exportSettings: () => {
      console.log('設定ストア: 設定エクスポート');
      const settings = get();
      const exportData = {
        darkMode: settings.darkMode,
        notifications: settings.notifications,
        language: settings.language,
        offlineMode: settings.offlineMode,
        autoSave: settings.autoSave,
        defaultServings: settings.defaultServings,
        defaultCookingTime: settings.defaultCookingTime,
        analyticsEnabled: settings.analyticsEnabled,
        dataSharingEnabled: settings.dataSharingEnabled,
      };
      return JSON.stringify(exportData, null, 2);
    },
    
    importSettings: (settingsJson: string) => {
      console.log('設定ストア: 設定インポート');
      try {
        const importedSettings = JSON.parse(settingsJson);
        // 安全性チェック
        const safeSettings: Partial<AppSettings> = {};
        
        Object.keys(defaultSettings).forEach(key => {
          if (key in importedSettings) {
            safeSettings[key as keyof AppSettings] = importedSettings[key];
          }
        });
        
        set((state) => {
          const newState = { ...state, ...safeSettings };
          saveToStorage(newState);
          return newState;
        });
        return true;
      } catch (error) {
        console.error('設定インポートエラー:', error);
        return false;
      }
    },
    
    loadSettings: () => {
      console.log('設定ストア: 設定読み込み');
      const storedSettings = loadFromStorage();
      set((state) => ({ ...state, ...storedSettings }));
    },
    
    saveSettings: () => {
      console.log('設定ストア: 設定保存');
      const currentState = get();
      saveToStorage(currentState);
    },
  };
});

// API キー管理用の別ストア（セッションストレージ使用）
interface ApiKeyState {
  keys: {
    groqApiKey: string;
    geminiApiKey: string;
    huggingfaceApiKey: string;
    togetherApiKey: string;
    anthropicApiKey: string;
    openaiApiKey: string;
  };
  preferredProviders: {
    mealGeneration: string;
    imageRecognition: string;
  };
  setApiKey: (provider: keyof ApiKeyState['keys'], key: string) => void;
  getApiKey: (provider: keyof ApiKeyState['keys']) => string;
  setPreferredProvider: (service: 'mealGeneration' | 'imageRecognition', provider: string) => void;
  getPreferredProvider: (service: 'mealGeneration' | 'imageRecognition') => string;
  clearAllKeys: () => void;
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  keys: {
    groqApiKey: '',
    geminiApiKey: '',
    huggingfaceApiKey: '',
    togetherApiKey: '',
    anthropicApiKey: '',
    openaiApiKey: '',
  },
  preferredProviders: {
    mealGeneration: '',
    imageRecognition: '',
  },
  
  setApiKey: (provider, key) => {
    console.log(`🔑 APIキーストア: ${provider} 設定開始`, {
      provider,
      keyLength: key.length,
      hasKey: !!key,
      keyPreview: key ? `${key.substring(0, 8)}...` : 'empty',
      timestamp: new Date().toISOString()
    });
    
    set((state) => {
      const newState = {
        keys: { ...state.keys, [provider]: key }
      };
      console.log(`🔄 APIキーストア: ${provider} 状態更新`, {
        oldKey: state.keys[provider] ? `${state.keys[provider].substring(0, 8)}...` : 'empty',
        newKey: key ? `${key.substring(0, 8)}...` : 'empty',
        newStateKeys: Object.keys(newState.keys).reduce((acc, k) => {
          acc[k] = newState.keys[k as keyof typeof newState.keys] ? 'SET' : 'EMPTY';
          return acc;
        }, {} as any)
      });
      return newState;
    });
    
    // ローカルストレージに保存（永続化）
    if (typeof window !== 'undefined') {
      try {
        // 簡易暗号化（Base64 + 文字列変換）
        const encryptedKey = btoa(encodeURIComponent(key));
        localStorage.setItem(`api_key_${provider}`, encryptedKey);
        const saved = localStorage.getItem(`api_key_${provider}`);
        console.log(`💾 LocalStorage保存: ${provider}`, {
          saved: !!saved,
          savedLength: saved?.length || 0,
          encrypted: true
        });
      } catch (error) {
        console.error(`❌ LocalStorage保存エラー: ${provider}`, error);
      }
    } else {
      console.warn('⚠️ window未定義のためLocalStorage保存をスキップ');
    }
    
    console.log(`✅ APIキーストア: ${provider} 設定完了`);
  },
  
  getApiKey: (provider) => {
    console.log(`🔍 APIキーストア: ${provider} 取得開始`);
    
    const state = get();
    let key = state.keys[provider];
    
    console.log(`📋 現在の状態: ${provider}`, {
      hasStateKey: !!key,
      stateKeyLength: key?.length || 0,
      stateKeyPreview: key ? `${key.substring(0, 8)}...` : 'empty'
    });
    
    // ローカルストレージから復元
    if (!key && typeof window !== 'undefined') {
      try {
        const storedEncryptedKey = localStorage.getItem(`api_key_${provider}`) || '';
        console.log(`💾 LocalStorage復元: ${provider}`, {
          hasStoredKey: !!storedEncryptedKey,
          storedKeyLength: storedEncryptedKey.length,
          encrypted: true
        });
        
        if (storedEncryptedKey) {
          try {
            // 簡易復号化（Base64 + 文字列変換）
            const decryptedKey = decodeURIComponent(atob(storedEncryptedKey));
            key = decryptedKey;
            set((state) => ({
              keys: { ...state.keys, [provider]: key }
            }));
            console.log(`🔄 ストア状態に復元: ${provider}`);
          } catch (decryptError) {
            console.error(`❌ APIキー復号化エラー: ${provider}`, decryptError);
            // 破損したデータを削除
            localStorage.removeItem(`api_key_${provider}`);
          }
        }
      } catch (error) {
        console.error(`❌ LocalStorage読み込みエラー: ${provider}`, error);
      }
    }
    
    console.log(`✅ APIキーストア: ${provider} 取得完了`, {
      finalKey: !!key,
      finalKeyLength: key?.length || 0
    });
    
    return key;
  },
  
  setPreferredProvider: (service, provider) => {
    console.log(`優先プロバイダー設定: ${service} -> ${provider}`);
    set((state) => ({
      preferredProviders: { ...state.preferredProviders, [service]: provider }
    }));
    
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem(`preferred_provider_${service}`, provider);
    }
  },
  
  getPreferredProvider: (service) => {
    const state = get();
    let provider = state.preferredProviders[service];
    
    // ローカルストレージから復元
    if (!provider && typeof window !== 'undefined') {
      provider = localStorage.getItem(`preferred_provider_${service}`) || '';
      if (provider) {
        set((state) => ({
          preferredProviders: { ...state.preferredProviders, [service]: provider }
        }));
      }
    }
    
    return provider;
  },
  
  clearAllKeys: () => {
    console.log('APIキーストア: 全キークリア');
    set({
      keys: {
        groqApiKey: '',
        geminiApiKey: '',
        huggingfaceApiKey: '',
        togetherApiKey: '',
        anthropicApiKey: '',
        openaiApiKey: '',
      },
      preferredProviders: {
        mealGeneration: '',
        imageRecognition: '',
      }
    });
    
    // ローカルストレージからも削除
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_key_groqApiKey');
      localStorage.removeItem('api_key_geminiApiKey');
      localStorage.removeItem('api_key_huggingfaceApiKey');
      localStorage.removeItem('api_key_togetherApiKey');
      localStorage.removeItem('api_key_anthropicApiKey');
      localStorage.removeItem('api_key_openaiApiKey');
      
      // 優先プロバイダー設定もクリア
      localStorage.removeItem('preferred_provider_mealGeneration');
      localStorage.removeItem('preferred_provider_imageRecognition');
    }
  },
}));

// APIキーの初期化関数（アプリ起動時に呼び出し）
export const initializeApiKeys = () => {
  if (typeof window === 'undefined') return;
  
  const apiKeyStore = useApiKeyStore.getState();
  const providers = ['groqApiKey', 'geminiApiKey', 'huggingfaceApiKey', 'togetherApiKey', 'anthropicApiKey', 'openaiApiKey'] as const;
  
  console.log('🔧 APIキーストア: 初期化開始');
  
  providers.forEach(provider => {
    try {
      const storedEncryptedKey = localStorage.getItem(`api_key_${provider}`) || '';
      if (storedEncryptedKey) {
        try {
          const decryptedKey = decodeURIComponent(atob(storedEncryptedKey));
          apiKeyStore.setApiKey(provider, decryptedKey);
          console.log(`🔑 APIキー復元: ${provider}`);
        } catch (decryptError) {
          console.error(`❌ APIキー復元エラー: ${provider}`, decryptError);
          localStorage.removeItem(`api_key_${provider}`);
        }
      }
    } catch (error) {
      console.error(`❌ APIキー初期化エラー: ${provider}`, error);
    }
  });
  
  console.log('✅ APIキーストア: 初期化完了');
};

// 設定の初期化関数（アプリ起動時に呼び出し）
export const initializeSettings = () => {
  if (typeof window === 'undefined') return;
  
  // ダークモード設定の適用
  const storedSettings = loadFromStorage();
  if (storedSettings.darkMode) {
    document.documentElement.classList.add('dark');
  }
  
  // APIキーの初期化
  initializeApiKeys();
};
