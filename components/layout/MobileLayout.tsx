'use client';

import Header from './Header';
import BottomNav from '../ui/BottomNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
  onBack?: () => void;
}

export default function MobileLayout({
  children,
  title,
  showBack = false,
  showMenu = false,
  showBottomNav = true,
  onMenuClick,
  onBack,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        title={title} 
        showBack={showBack} 
        showMenu={showMenu}
        onMenuClick={onMenuClick}
        onBack={onBack}
      />
      
      <main className={`flex-1 ${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {showBottomNav && <BottomNav />}
    </div>
  );
}
