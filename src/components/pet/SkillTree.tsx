'use client';

import { motion } from 'framer-motion';
import type { SkillBranch } from '@/lib/pet-engine';
import { BRANCH_INFO, getBranchSkills } from '@/lib/skill-tree';

interface SkillTreeProps {
  skills: SkillBranch;
  evolutionPath: string | null;
}

export function SkillTree({ skills, evolutionPath }: SkillTreeProps) {
  const branches = Object.entries(BRANCH_INFO) as [keyof SkillBranch, typeof BRANCH_INFO[keyof SkillBranch]][];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-bold text-center" style={{ color: 'var(--text-primary)' }}>
        🌟 Dovednosti
      </h3>

      {evolutionPath && (
        <div className="text-center text-xs p-2 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          Evoluční cesta: <strong>{getPathLabel(evolutionPath)}</strong>
        </div>
      )}

      {/* Pentagon-style layout — simplified as vertical cards */}
      <div className="space-y-3">
        {branches.map(([key, info], i) => {
          const value = skills[key];
          const branchSkills = getBranchSkills(key, value);
          const unlockedCount = branchSkills.filter(s => s.unlocked).length;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-3"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              {/* Branch header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {info.name}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: info.color }}>
                  {value}/100
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-secondary)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: info.color }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Skills row */}
              <div className="flex gap-1.5">
                {branchSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="flex flex-col items-center gap-0.5 flex-1"
                    title={`${skill.name}: ${skill.description}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        skill.unlocked ? '' : 'opacity-30 grayscale'
                      }`}
                      style={{
                        background: skill.unlocked ? info.color + '20' : 'var(--bg-secondary)',
                        border: skill.unlocked ? `1px solid ${info.color}` : '1px solid transparent',
                      }}
                    >
                      {skill.emoji}
                    </div>
                    <span
                      className="text-[8px] text-center leading-tight"
                      style={{ color: skill.unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Unlock hint */}
              {unlockedCount < 5 && (
                <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Další: {branchSkills.find(s => !s.unlocked)?.name} ({branchSkills.find(s => !s.unlocked)?.threshold} bodů)
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getPathLabel(path: string): string {
  const labels: Record<string, string> = {
    athletic: '⚡ Atlet', scholar: '📚 Učenec', artist: '🎨 Umělec',
    healer: '🌿 Léčitel', trickster: '😜 Šprýmař',
  };
  return labels[path] || path;
}
