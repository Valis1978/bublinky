'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import { loadPet, calculateMood, type PetState, type PetSpecies } from '@/lib/pet-engine';
import { rewardRoundsLeft } from '@/lib/game-rewards';

const games = [
  {
    id: 'bubliny',
    name: 'Bublinkovaná',
    emoji: '🫧',
    description: 'Praskej bubliny!',
    color: '#F472B6',
    bg: 'linear-gradient(135deg, #FDF2F8, #EDE9FE)',
    isNew: true,
  },
  {
    id: 'prehlidka',
    name: 'Módní přehlídka',
    emoji: '👗',
    description: 'Obleč mazlíčka na molo!',
    color: '#C084FC',
    bg: 'linear-gradient(135deg, #FAF5FF, #FCE7F3)',
    isNew: true,
  },
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
  {
    id: 'emoji-quiz',
    name: 'Emoji kvíz',
    emoji: '🤔',
    description: 'Uhádni z emoji!',
    color: '#E879F9',
    bg: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)',
  },
  {
    id: 'ai-quiz',
    name: 'AI Kvíz',
    emoji: '✨',
    description: 'Kvíz o čemkoliv!',
    color: '#8B5CF6',
    bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
  },
];

// reward gameIds differ from route ids for two games (see game-rewards sweep)
const REWARD_ID: Record<string, string> = { puzzle2048: '2048' };

export default function GamesPage() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [roundsLeft, setRoundsLeft] = useState<Record<string, number>>({});

  useEffect(() => {
    setPet(loadPet());
    const map: Record<string, number> = {};
    for (const g of games) map[g.id] = rewardRoundsLeft(REWARD_ID[g.id] ?? g.id);
    setRoundsLeft(map);
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-nav safe-top">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Hry
          </h1>
          {pet && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              <MiniPet
                species={pet.species as PetSpecies}
                stage={pet.stage}
                mood={calculateMood(pet)}
                outfit={pet.activeOutfit}
                evolutionPath={pet.evolutionPath}
                size={26}
              />
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {pet.name} fandí!
              </span>
            </div>
          )}
        </div>

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
                className="relative block p-4 rounded-2xl transition-transform active:scale-95"
                style={{
                  background: game.bg,
                  border: `1px solid ${game.color}20`,
                }}
              >
                {game.isNew && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--accent)' }}>
                    NOVÉ
                  </span>
                )}
                <div className="text-3xl mb-2">{game.emoji}</div>
                <p className="font-bold text-sm" style={{ color: game.color }}>
                  {game.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {game.description}
                </p>
                {(roundsLeft[game.id] ?? 0) > 0 && (
                  <p className="text-[10px] mt-1 font-medium" style={{ color: '#D97706' }}>
                    🪙 mince ve hře
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-[11px] text-center mt-4 px-6" style={{ color: 'var(--text-muted)' }}>
          Za hraní získáváš mince pro mazlíčka — první tři kola každé hry denně. Pak hrajeme jen tak pro radost! 🫧
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
