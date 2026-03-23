'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';

const games = [
  {
    id: 'tictactoe',
    name: 'Piškvorky',
    emoji: '❌',
    description: 'Hraj proti tátovi!',
    color: '#F472B6',
    bg: 'linear-gradient(135deg, #FDF2F8, #FCE7F3)',
  },
  {
    id: 'memory',
    name: 'Pexeso',
    emoji: '🃏',
    description: 'Najdi všechny páry',
    color: '#A78BFA',
    bg: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
  },
  {
    id: 'minesweeper',
    name: 'Hledání min',
    emoji: '💣',
    description: 'Odkryj pole bez výbuchu',
    color: '#34D399',
    bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
  },
  {
    id: 'wordle',
    name: 'Slovo dne',
    emoji: '🟩',
    description: 'Uhádni české slovo',
    color: '#FBBF24',
    bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
  },
  {
    id: 'puzzle2048',
    name: '2048',
    emoji: '🔢',
    description: 'Spojuj čísla!',
    color: '#FB923C',
    bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
  },
  {
    id: 'snake',
    name: 'Had',
    emoji: '🐍',
    description: 'Klasická hra',
    color: '#4ADE80',
    bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
  },
];

export default function GamesPage() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Hry
        </h1>

        <div className="grid grid-cols-2 gap-3">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/games/${game.id}`}
                className="block p-4 rounded-2xl transition-transform active:scale-95"
                style={{
                  background: game.bg,
                  border: `1px solid ${game.color}20`,
                }}
              >
                <div className="text-3xl mb-2">{game.emoji}</div>
                <p className="font-bold text-sm" style={{ color: game.color }}>
                  {game.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {game.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
