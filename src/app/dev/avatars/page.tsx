'use client';

// Internal design QA page — grid of every species × stage × mood + accessories.
// Not linked from anywhere; reachable at /dev/avatars (behind auth like all pages).

import { useState } from 'react';
import { PetAvatar } from '@/components/pet/avatar/PetAvatar';
import { SPECIES } from '@/components/pet/avatar/species';
import type { PetMood, PetSpecies, PetStage } from '@/lib/pet-engine';

const ALL_SPECIES = Object.keys(SPECIES) as PetSpecies[];
const STAGES: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult', 'legendary'];
const MOODS: PetMood[] = ['ecstatic', 'happy', 'neutral', 'sad', 'hungry', 'tired', 'dirty', 'sleeping', 'vacation'];
const OUTFITS: Record<string, string>[] = [
  {},
  { head: 'acc_crown', neck: 'acc_scarf' },
  { head: 'acc_wizard', face: 'acc_glasses', back: 'acc_cape' },
  { head: 'acc_bow', back: 'acc_wings', neck: 'acc_medal' },
];

export default function AvatarPreview() {
  const [mood, setMood] = useState<PetMood>('happy');
  const [outfitIdx, setOutfitIdx] = useState(0);

  return (
    <div className="p-4 space-y-4" style={{ background: '#FFF5F7', minHeight: '100dvh' }}>
      <h1 className="font-bold text-lg">Avatar rig QA</h1>
      <div className="flex gap-1 flex-wrap">
        {MOODS.map(m => (
          <button key={m} onClick={() => setMood(m)}
            className="px-2 py-1 rounded-lg text-xs font-medium"
            style={{ background: m === mood ? '#F9A8D4' : '#FFFFFF', border: '1px solid #eee' }}>
            {m}
          </button>
        ))}
        <button onClick={() => setOutfitIdx(i => (i + 1) % OUTFITS.length)}
          className="px-2 py-1 rounded-lg text-xs font-bold"
          style={{ background: '#C4B5FD', border: '1px solid #eee' }}>
          outfit {outfitIdx}
        </button>
      </div>

      {ALL_SPECIES.map(sp => (
        <div key={sp}>
          <h2 className="text-sm font-bold mb-1">{SPECIES[sp].name}</h2>
          <div className="flex flex-wrap items-end gap-1 p-2 rounded-2xl" style={{ background: '#FFFFFF' }}>
            {STAGES.map(st => (
              <div key={st} className="flex flex-col items-center">
                <PetAvatar species={sp} stage={st} mood={mood}
                  outfit={st === 'adult' || st === 'legendary' ? OUTFITS[outfitIdx] : {}}
                  evolutionPath={st === 'legendary' ? 'scholar' : null}
                  size={110} />
                <span className="text-[9px] text-gray-400">{st}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
