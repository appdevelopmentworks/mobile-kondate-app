'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  HardDrive,
  FileText,
  Image,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface CacheInfo {
  type: string;
  name: string;
  size: number;
  count: number;
  description: string;
  icon: any;
}

export default function CacheManager() {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateStorageSize = async (): Promise<CacheInfo[]> => {
    const cacheList: CacheInfo[] = [];
    let total = 0;

    try {
      // LocalStorage
      const localStorageSize = new Blob(Object.values(localStorage)).size;
      cacheList.push({
        type: 'localStorage',
        name: 'アプリ設定',
        size: localStorageSize,
        count: Object.keys(localStorage).length,
        description: '設定データ、APIキー、ユーザー設定',
        icon: Database
      });
      total += localStorageSize;

      // SessionStorage
      const sessionStorageSize = new Blob(Object.values(sessionStorage)).size;
      cacheList.push({
        type: 'sessionStorage',
        name: 'セッションデータ',
        size: sessionStorageSize,
        count: Object.keys(sessionStorage).length,
        description: 'APIキー、一時的なデータ',
        icon: Zap
      });
      total += sessionStorageSize;

      // IndexedDB (if available)
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          let indexedDBSize = 0;
          let indexedDBCount = 0;
          
          for (let i = 0; i < databases.length; i++) {
            const db = databases[i];
            indexedDBCount++;
            // IndexedDBのサイズ計算は複雑なので概算
            indexedDBSize += 1000; // 1KB per database as estimate
          }
          
          if (indexedDBCount > 0) {
            cacheList.push({
              type: 'indexedDB',
              name: 'アプリデータベース',
              size: indexedDBSize,
              count: indexedDBCount,
              description: '献立履歴、お気に入り、キャッシュ',
              icon: HardDrive
            });
            total += indexedDBSize;
          }
        } catch (error) {
          console.warn('IndexedDB情報の取得に失敗:', error);
        }
      }

      // Service Worker Cache (if available)
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheNameArray = Array.from(cacheNames);
          let swCacheSize = 0;
          let swCacheCount = 0;
          
          for (let i = 0; i < cacheNameArray.length; i++) {
            const cacheName = cacheNameArray[i];
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            swCacheCount += requests.length;
            swCacheSize += requests.length * 5000; // 5KB per request as estimate
          }
          
          if (swCacheCount > 0) {
            cacheList.push({
              type: 'swCache',
              name: 'Webキャッシュ',
              size: swCacheSize,
              count: swCacheCount,
              description: 'ページ、画像、スクリプトキャッシュ',
              icon: Image
            });
            total += swCacheSize;
          }
        } catch (error) {
          console.warn('Service Workerキャッシュ情報の取得に失敗:', error);
        }
      }

    } catch (error) {
      console.error('ストレージ情報の計算に失敗:', error);
    }

    setTotalSize(total);
    return cacheList;
  };

  const refreshCacheInfo = async () => {
    setIsRefreshing(true);
    try {
      const info = await calculateStorageSize();
      setCacheInfo(info);
    } catch (error) {
      console.error('キャッシュ情報の更新に失敗:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearCache = async (type: string) => {
    if (!confirm(`${type}のデータを削除しますか？この操作は元に戻せません。`)) {
      return;
    }

    setIsClearing(type);
    
    try {
      switch (type) {
        case 'localStorage':
          // 重要な設定以外をクリア
          const keepKeys = ['mobile-kondate-settings'];
          const keysToRemove = Object.keys(localStorage).filter(
            key => !keepKeys.includes(key)
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
          break;

        case 'sessionStorage':
          sessionStorage.clear();
          break;

        case 'indexedDB':
          if ('indexedDB' in window) {
            const databases = await indexedDB.databases();
            for (let i = 0; i < databases.length; i++) {
              const db = databases[i];
              if (db.name && db.name !== 'mobile-kondate-app') { // アプリ固有のDBは保護
                indexedDB.deleteDatabase(db.name);
              }
            }
          }
          break;

        case 'swCache':
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            const cacheNameArray = Array.from(cacheNames);
            await Promise.all(
              cacheNameArray.map(cacheName => caches.delete(cacheName))
            );
          }
          break;

        default:
          throw new Error(`不明なキャッシュタイプ: ${type}`);
      }

      // キャッシュ情報を更新
      await refreshCacheInfo();
      
    } catch (error) {
      console.error(`${type}のクリアに失敗:`, error);
      alert(`${type}のクリアに失敗しました`);
    } finally {
      setIsClearing(null);
    }
  };

  const clearAllCache = async () => {
    if (!confirm('すべてのキャッシュデータを削除しますか？アプリの設定は保持されます。')) {
      return;
    }

    setIsClearing('all');
    
    try {
      await Promise.all([
        clearCache('sessionStorage'),
        clearCache('swCache')
      ]);
      
      // 非重要なLocalStorageデータをクリア
      const keepKeys = ['mobile-kondate-settings'];
      const keysToRemove = Object.keys(localStorage).filter(
        key => !keepKeys.includes(key)
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      await refreshCacheInfo();
      
    } catch (error) {
      console.error('全キャッシュクリアに失敗:', error);
    } finally {
      setIsClearing(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    refreshCacheInfo();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              ストレージ・キャッシュ管理
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              アプリのデータ使用量確認とキャッシュクリア
            </p>
          </div>
          <button
            onClick={refreshCacheInfo}
            disabled={isRefreshing}
            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 総使用量 */}
      <div className="p-4 bg-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-700">総ストレージ使用量</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatBytes(totalSize)}
            </div>
          </div>
          <button
            onClick={clearAllCache}
            disabled={isClearing === 'all'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isClearing === 'all' ? 'クリア中...' : '全てクリア'}
          </button>
        </div>
      </div>

      {/* 個別キャッシュ情報 */}
      <div className="divide-y divide-gray-100">
        {cacheInfo.map((cache) => (
          <div key={cache.type} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <cache.icon className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">{cache.name}</div>
                  <div className="text-sm text-gray-600">{cache.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatBytes(cache.size)} • {cache.count}件のデータ
                  </div>
                </div>
              </div>
              <button
                onClick={() => clearCache(cache.type)}
                disabled={isClearing === cache.type}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" />
                {isClearing === cache.type ? '削除中...' : 'クリア'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {cacheInfo.length === 0 && !isRefreshing && (
        <div className="p-8 text-center text-gray-500">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>キャッシュデータが見つかりませんでした</p>
        </div>
      )}

      {/* 注意事項 */}
      <div className="p-4 bg-amber-50 border-t border-gray-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-amber-900 mb-1">キャッシュクリアについて</div>
            <ul className="text-amber-800 space-y-1 text-xs">
              <li>• アプリ設定は削除されません</li>
              <li>• APIキーは削除される場合があります</li>
              <li>• 献立履歴は影響を受ける可能性があります</li>
              <li>• ページの読み込み速度が一時的に低下する場合があります</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}