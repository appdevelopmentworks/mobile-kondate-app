'use client';

import React from 'react';
import Header from './Header';
import BottomNav from '../ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
}

export default function MobileLayout({
  children,
  title,
  showBack = false,
  showMenu = false,
  showBottomNav = true,
  onMenuClick,
}: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        title={title}
        showBack={showBack}
        showMenu={showMenu}
        onMenuClick={onMenuClick}
      />
      
      <AnimatePresence mode="wait">
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 ${showBottomNav ? 'pb-[calc(56px+env(safe-area-inset-bottom))]' : ''}`}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      
      {showBottomNav && <BottomNav />}
    </div>
  );
}
