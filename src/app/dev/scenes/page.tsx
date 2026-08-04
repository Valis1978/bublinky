'use client';

// Internal design QA — every story genre scene × journey variant.
// Not linked from anywhere; reachable at /dev/scenes (behind auth).

import { SCENES } from '@/components/stories/scenes';
import { GENRES } from '@/types/story';

const VARIANTS = [0, 1, 2] as const;
const LABELS = ['0 · setkání', '1 · hloubka', '2 · finále'];

export default function ScenesPreview() {
  return (
    <div className="p-4 space-y-5" style={{ background: '#FFF5F7', minHeight: '100dvh' }}>
      <h1 className="font-bold text-lg">Story scenes QA</h1>
      {GENRES.map(g => {
        const Scene = SCENES[g.id];
        if (!Scene) return null;
        return (
          <div key={g.id}>
            <h2 className="text-sm font-bold mb-1">{g.emoji} {g.label}</h2>
            <div className="grid grid-cols-3 gap-2">
              {VARIANTS.map(v => (
                <div key={v}>
                  <div className="rounded-xl overflow-hidden" style={{ height: 130 }}>
                    <Scene variant={v} />
                  </div>
                  <p className="text-[10px] text-center mt-0.5" style={{ color: '#9CA3AF' }}>{LABELS[v]}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
