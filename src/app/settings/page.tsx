'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Info, 
  ChevronRight,
  Smartphone,
  Database,
  LogOut
} from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const settingsGroups = [
    {
      title: 'アプリ設定',
      items: [
        {
          icon: Bell,
          label: '通知',
          value: notifications ? 'オン' : 'オフ',
          onClick: () => setNotifications(!notifications),
          toggle: true,
        },
        {
          icon: Moon,
          label: 'ダークモード',
          value: darkMode ? 'オン' : 'オフ',
          onClick: () => setDarkMode(!darkMode),
          toggle: true,
        },
        {
          icon: Globe,
          label: '言語',
          value: '日本語',
          onClick: () => {},
        },
      ],
    },
    {
      title: 'データ管理',
      items: [
        {
          icon: Database,
          label: 'データのエクスポート',
          onClick: () => alert('準備中です'),
        },
        {
          icon: Smartphone,
          label: 'オフライン設定',
          value: '有効',
          onClick: () => {},
        },
      ],
    },
    {
      title: 'その他',
      items: [
        {
          icon: Shield,
          label: 'プライバシーポリシー',
          onClick: () => {},
        },
        {
          icon: Info,
          label: 'このアプリについて',
          value: 'v1.0.0',
          onClick: () => {},
        },
        {
          icon: LogOut,
          label: 'ログアウト',
          onClick: () => alert('ログアウト機能は準備中です'),
          danger: true,
        },
      ],
    },
  ];

  return (
    <MobileLayout title="設定" showBack={true}>
      <div className="px-4 py-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">
              {group.title}
            </h3>
            
            <Card className="overflow-hidden">
              {group.items.map((item, index) => {
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      index !== group.items.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                        item.danger ? 'bg-red-50' : 'bg-gray-50'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          item.danger ? 'text-red-500' : 'text-gray-600'
                        }`} />
                      </div>
                      <span className={`font-medium ${
                        item.danger ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      {item.value && (
                        <span className="text-sm text-gray-500 mr-2">
                          {item.value}
                        </span>
                      )}
                      
                      {item.toggle ? (
                        <div className={`relative w-12 h-6 rounded-full transition-colors ${
                          item.value === 'オン' ? 'bg-primary-500' : 'bg-gray-300'
                        }`}>
                          <motion.div
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                            animate={{
                              left: item.value === 'オン' ? '24px' : '4px',
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </Card>
          </motion.div>
        ))}
        
        {/* アプリ情報 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>モバイル献立アプリ</p>
          <p>Version 1.0.0</p>
          <p className="mt-2">© 2024 Mobile Kondate App</p>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
