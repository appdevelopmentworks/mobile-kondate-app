'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Calendar, 
  Star, 
  AlertCircle,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';

interface NotificationSettingsProps {
  settings: {
    enabled: boolean;
    mealReminders: boolean;
    favoriteUpdates: boolean;
    weeklyPlanning: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    reminderTime: string;
  };
  onUpdate: (settings: any) => void;
}

export default function NotificationSettings({ settings, onUpdate }: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        onUpdate({ ...settings, enabled: true });
        
        // テスト通知を送信
        new Notification('献立アプリ', {
          body: '通知が有効になりました！',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test-notification'
        });
      }
    } catch (error) {
      console.error('通知許可リクエストエラー:', error);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const updateReminderTime = (time: string) => {
    onUpdate({ ...settings, reminderTime: time });
  };

  const notificationItems = [
    {
      key: 'mealReminders' as const,
      icon: Clock,
      title: '食事のリマインダー',
      description: '設定した時間に献立作成を通知',
      enabled: settings.mealReminders,
    },
    {
      key: 'favoriteUpdates' as const,
      icon: Star,
      title: 'お気に入り更新通知',
      description: '新しいレシピがお気に入りに追加された時',
      enabled: settings.favoriteUpdates,
    },
    {
      key: 'weeklyPlanning' as const,
      icon: Calendar,
      title: '週間プランニング',
      description: '毎週日曜日に次週の献立作成を通知',
      enabled: settings.weeklyPlanning,
    },
  ];

  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知設定
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          アプリからの通知を詳細に設定できます
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {/* 通知許可状況 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <BellRing className="w-5 h-5 text-green-600" />
              ) : permission === 'denied' ? (
                <Bell className="w-5 h-5 text-red-600" />
              ) : (
                <Bell className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900">通知許可状況</div>
                <div className="text-sm text-gray-600">
                  {permission === 'granted' && '通知が許可されています'}
                  {permission === 'denied' && '通知がブロックされています'}
                  {permission === 'default' && '通知許可が未設定です'}
                </div>
              </div>
            </div>
            {permission !== 'granted' && isNotificationSupported && (
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                許可する
              </button>
            )}
          </div>

          {!isNotificationSupported && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  このブラウザは通知機能に対応していません
                </span>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <div className="text-sm">
                  <div className="font-medium text-red-900">通知がブロックされています</div>
                  <div className="text-red-700 mt-1">
                    ブラウザの設定から通知を許可してください
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* メイン通知切り替え */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">通知を有効にする</div>
                <div className="text-sm text-gray-600">
                  すべての通知機能のマスタースイッチ
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleSetting('enabled')}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* 個別通知設定 */}
        {settings.enabled && (
          <>
            {notificationItems.map((item) => (
              <div key={item.key} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting(item.key)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      item.enabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      item.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            ))}

            {/* リマインダー時間設定 */}
            {settings.mealReminders && (
              <div className="p-4 bg-blue-50">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-900">リマインダー時間</div>
                    <div className="text-sm text-blue-700">
                      毎日この時間に献立作成を通知します
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => updateReminderTime(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => updateReminderTime('18:00')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    18:00に設定
                  </button>
                </div>
              </div>
            )}

            {/* 通知スタイル設定 */}
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">通知スタイル</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">サウンド</div>
                      <div className="text-sm text-gray-600">通知音を再生</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting('soundEnabled')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">バイブレーション</div>
                      <div className="text-sm text-gray-600">端末を振動させる</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting('vibrationEnabled')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.vibrationEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">通知について</p>
          <ul className="space-y-1">
            <li>• 通知はローカルで生成され、外部サーバーは使用しません</li>
            <li>• ブラウザを閉じている間は通知されません</li>
            <li>• PWAとしてインストールすると通知が改善されます</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}