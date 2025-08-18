'use client';

import { Home, Clock, Heart, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: Home, label: 'ホーム' },
  { href: '/history', icon: Clock, label: '履歴' },
  { href: '/favorites', icon: Heart, label: 'お気に入り' },
  { href: '/settings', icon: Settings, label: '設定' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav safe-area-inset">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
