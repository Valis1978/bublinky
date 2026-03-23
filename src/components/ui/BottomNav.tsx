'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, ListTodo, GraduationCap, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/tasks', label: 'Úkoly', icon: ListTodo },
  { href: '/learn', label: 'Učení', icon: GraduationCap },
  { href: '/profile', label: 'Profil', icon: User },
];

interface BottomNavProps {
  unreadCount?: number;
}

export function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 py-1 px-4 transition-colors"
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                />
                {href === '/chat' && unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full
                      flex items-center justify-center text-[10px] font-bold text-white px-1"
                    style={{ background: 'var(--coral)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-2 right-2 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
