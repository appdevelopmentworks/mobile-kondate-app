'use client';

import { ChevronLeft, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export default function Header({ 
  title = 'こんだて', 
  showBack = false, 
  showMenu = false,
  onMenuClick 
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-white/30">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="touch-target p-2 -ml-2 rounded-lg active:bg-white/20 transition-colors"
              aria-label="戻る"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-800">
            {title}
          </h1>
        </div>
        
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="touch-target p-2 -mr-2 rounded-lg active:bg-white/20 transition-colors"
            aria-label="メニュー"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        )}
      </div>
    </header>
  );
}
