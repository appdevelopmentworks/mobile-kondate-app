'use client';

import React from 'react';
import { ArrowLeft, Menu, Home } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export default function Header({ 
  title = '献立アプリ', 
  showBack = false,
  showMenu = false,
  onMenuClick 
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleBack = () => {
    router.back();
  };
  
  const handleHome = () => {
    router.push('/');
  };
  
  // パスに基づいてタイトルを自動設定
  const getTitle = () => {
    if (title !== '献立アプリ') return title;
    
    if (pathname.includes('/meal-form')) return '献立作成';
    if (pathname.includes('/result')) return '献立結果';
    if (pathname.includes('/camera')) return 'カメラ';
    if (pathname === '/') return '献立アプリ';
    
    return title;
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-top"
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* 左側のボタン */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={handleBack}
              className="touch-target flex items-center justify-center -ml-2"
              aria-label="戻る"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          ) : (
            <button
              onClick={handleHome}
              className="touch-target flex items-center justify-center -ml-2"
              aria-label="ホーム"
            >
              <Home className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* タイトル */}
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900 truncate px-4">
          {getTitle()}
        </h1>

        {/* 右側のボタン */}
        <div className="flex items-center">
          {showMenu ? (
            <button
              onClick={onMenuClick}
              className="touch-target flex items-center justify-center -mr-2"
              aria-label="メニュー"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          ) : (
            <div className="w-10" /> 
          )}
        </div>
      </div>
    </motion.header>
  );
}
