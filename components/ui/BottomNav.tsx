'use client';

import { Home, Heart, Clock, Settings, Camera } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  
  // カメラ機能が必要なページ
  const cameraRequiredPages = ['/camera', '/camera-recognition', '/meal-form/3', '/ingredients'];
  const showCameraButton = cameraRequiredPages.some(page => pathname.startsWith(page));
  
  // 動的にナビゲーションアイテムを生成
  const navItems = [
    { href: '/', icon: Home, label: 'ホーム' },
    showCameraButton 
      ? { href: '/camera', icon: Camera, label: 'カメラ' }
      : { href: '/favorites', icon: Heart, label: 'お気に入り' },
    { href: '/history', icon: Clock, label: '履歴' },
    { href: '/settings', icon: Settings, label: '設定' },
  ];

  // より厳密なアクティブ状態の判定
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bottom-nav safe-area-inset">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const isCameraButton = item.href === '/camera';
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item group relative ${active ? 'bottom-nav-item-active' : ''} transition-all duration-200 hover:scale-105 ${isCameraButton ? 'px-3' : ''}`}
          >
            {/* アクティブ状態のインジケーター */}
            {active && !isCameraButton && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-pink-600 rounded-full" />
            )}
            
            {/* カメラボタン専用のスタイリング */}
            {isCameraButton ? (
              <div className="flex flex-col items-center">
                {/* カメラボタンのコンテナ */}
                <div className={`
                  relative mb-1 p-2 rounded-full transition-all duration-300
                  ${active 
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg transform scale-110' 
                    : 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-md hover:shadow-lg'
                  }
                `}>
                  <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                  
                  {/* カメラボタンのパルス効果 */}
                  {!active && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 animate-ping opacity-20" />
                  )}
                </div>
                
                {/* カメララベル */}
                <span className={`text-xs font-medium ${active ? 'font-bold text-pink-700 dark:text-pink-400' : 'font-semibold text-pink-600 dark:text-pink-500'} transition-all duration-200`}>
                  {item.label}
                </span>
              </div>
            ) : (
              /* 通常のナビゲーションアイテム */
              <>
                {/* アイコンコンテナ */}
                <div className={`relative ${active ? 'transform scale-110' : ''} transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 mb-1 ${active ? 'drop-shadow-sm' : ''}`} />
                  
                  {/* アクティブ時の背景円 */}
                  {active && (
                    <div className="absolute inset-0 -m-1 bg-pink-100 dark:bg-pink-900/30 rounded-full -z-10 opacity-50" />
                  )}
                </div>
                
                {/* ラベル */}
                <span className={`text-xs font-medium ${active ? 'font-semibold' : ''} transition-all duration-200`}>
                  {item.label}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
