'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, PlusCircle, Clock, Heart, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  
  const navItems = [
    { icon: Home, label: 'ホーム', path: '/' },
    { icon: PlusCircle, label: '作成', path: '/meal-form' },
    { icon: Clock, label: '履歴', path: '/history' },
    { icon: Heart, label: 'お気に入り', path: '/favorites' },
    { icon: Settings, label: '設定', path: '/settings' },
  ];
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex-1 flex flex-col items-center justify-center touch-target relative"
              aria-label={item.label}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-b-full"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}
              
              <Icon 
                className={`w-5 h-5 ${
                  active ? 'text-primary-500' : 'text-gray-500'
                }`}
              />
              
              <span 
                className={`text-xs mt-1 ${
                  active ? 'text-primary-500 font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              
              {/* 作成ボタンは特別なスタイル */}
              {item.path === '/meal-form' && (
                <div className="absolute -top-1 -right-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
