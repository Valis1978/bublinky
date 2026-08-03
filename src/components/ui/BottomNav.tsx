'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home, MessageCircle, ListTodo, Gamepad2, GraduationCap, User, PawPrint,
  LayoutDashboard, type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loadPet, calculateMood, type PetState, type PetSpecies } from '@/lib/pet-engine';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import { hapticTap } from '@/lib/haptics';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** render the live pet avatar instead of the icon */
  petSlot?: boolean;
}

const CHILD_ITEMS: NavItem[] = [
  { href: '/home', label: 'Domů', icon: Home },
  { href: '/pet', label: 'Mazlíček', icon: PawPrint, petSlot: true },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/games', label: 'Hry', icon: Gamepad2 },
  { href: '/learn', label: 'Učení', icon: GraduationCap },
];

const PARENT_ITEMS: NavItem[] = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/tasks', label: 'Úkoly', icon: ListTodo },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profil', icon: User },
];

interface BottomNavProps {
  unreadCount?: number;
}

export function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<'child' | 'parent'>('child');
  const [pet, setPet] = useState<PetState | null>(null);

  // Role + pet are client-only (localStorage) — resolve after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bub_user');
      if (raw && JSON.parse(raw)?.role === 'parent') {
        setRole('parent');
        setPet(null);
        return;
      }
    } catch { /* default child */ }
    setRole('child');
    setPet(loadPet());
  }, [pathname]);

  const items = role === 'parent' ? PARENT_ITEMS : CHILD_ITEMS;

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
        {items.map(({ href, label, icon: Icon, petSlot }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          const showAvatar = petSlot && pet;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => { void hapticTap(); }}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 transition-colors"
            >
              <div className="relative flex items-center justify-center" style={{ height: 24 }}>
                {showAvatar ? (
                  <div style={{ opacity: isActive ? 1 : 0.8 }}>
                    <MiniPet
                      species={pet.species as PetSpecies}
                      stage={pet.stage}
                      mood={calculateMood(pet)}
                      outfit={pet.activeOutfit}
                      evolutionPath={pet.evolutionPath}
                      size={30}
                    />
                  </div>
                ) : (
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                )}
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
                className="text-[10px] font-medium max-w-[64px] truncate"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {petSlot && pet ? pet.name : label}
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
