'use client';

import { motion } from 'framer-motion';
import { Home, MessageCircle, Star, Backpack, Sparkles } from 'lucide-react';

export type PetTab = 'home' | 'chat' | 'quests' | 'inventory' | 'skills';

interface PetTabBarProps {
  active: PetTab;
  onChange: (tab: PetTab) => void;
  unreadChat?: number;
  activeQuests?: number;
}

const TABS: { id: PetTab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Domov' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'quests', icon: Star, label: 'Questy' },
  { id: 'inventory', icon: Backpack, label: 'Batoh' },
  { id: 'skills', icon: Sparkles, label: 'Skilly' },
];

export function PetTabBar({ active, onChange, unreadChat, activeQuests }: PetTabBarProps) {
  return (
    <div
      className="fixed left-0 right-0 z-40 flex justify-around py-1 px-2"
      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', bottom: '76px' }}
    >
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        const badge = tab.id === 'chat' ? unreadChat : tab.id === 'quests' ? activeQuests : undefined;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl relative transition-all"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <div className="relative">
              <Icon size={18} />
              {badge && badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                  style={{ background: '#EF4444' }}
                >
                  {badge > 9 ? '9+' : badge}
                </motion.span>
              )}
            </div>
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
