'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Globe, Microscope, Lock } from 'lucide-react';

const subjects = [
  {
    id: 'czech',
    name: 'Čeština',
    description: 'Vyjmenovaná slova, i/y',
    icon: BookOpen,
    color: '#E879F9',
    bg: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)',
    ready: true,
  },
  {
    id: 'math',
    name: 'Matematika',
    description: 'Počítání, násobilka, úlohy',
    icon: Calculator,
    color: '#60A5FA',
    bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    ready: true,
  },
  {
    id: 'geography',
    name: 'Vlastivěda',
    description: 'Kraje, řeky, vlajky',
    icon: Globe,
    color: '#34D399',
    bg: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
    ready: true,
  },
  {
    id: 'science',
    name: 'Přírodověda',
    description: 'Rostliny, zvířata, příroda',
    icon: Microscope,
    color: '#FBBF24',
    bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    ready: true,
  },
];

export default function LearnPage() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Učení
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Vyber si předmět a procvičuj
        </p>

        <div className="space-y-3">
          {subjects.map((subject, i) => {
            const Icon = subject.icon;
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl flex items-center gap-4 transition-transform active:scale-[0.98]"
                style={{
                  background: subject.bg,
                  border: `1px solid ${subject.color}20`,
                  opacity: subject.ready ? 1 : 0.6,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${subject.color}20` }}
                >
                  <Icon size={28} style={{ color: subject.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base" style={{ color: subject.color }}>
                    {subject.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {subject.description}
                  </p>
                </div>
                {!subject.ready && (
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                )}
              </motion.div>
            );

            if (!subject.ready) {
              return <div key={subject.id}>{content}</div>;
            }

            return (
              <Link key={subject.id} href={`/learn/${subject.id}`}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
