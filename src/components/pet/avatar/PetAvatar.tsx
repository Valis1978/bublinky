'use client';

// PetAvatar — the Bublík character rig.
// Layer order (bottom → top):
//   aura → [scaled body group: earsBack → tail → cape → body+belly+feet →
//   earsFront → extras → shine → snout → face → blink → face-acc →
//   head-acc/evolution → neck-acc → effects] → (egg replaces all of this)

import { useMemo } from 'react';
import type { PetMood } from '@/lib/pet-engine';
import { SPECIES } from './species';
import { Face, BlinkLids, BubbleShine, SleepZzz, StinkSquiggles, JoySparkles, LegendaryAura } from './parts';
import { AccessoryLayer, EvolutionProp } from './accessories';
import { STAGE_SCALE, type PetAvatarProps } from './types';

const RIG_CSS = `
.bub-avatar { display: block; }
.bub-avatar .bub-anim-root { transform-origin: 100px 170px; transform-box: view-box; animation: bub-breathe 3.2s ease-in-out infinite; }
.bub-avatar .bub-bounce { transform-origin: 100px 170px; transform-box: view-box; animation: bub-bounce 0.55s cubic-bezier(.36,1.6,.4,1) 1; }
.bub-avatar .bub-blink { opacity: 0; animation: bub-blink 4.4s linear infinite; }
.bub-avatar .bub-tail { transform-box: view-box; animation: bub-wag 2.6s ease-in-out infinite; }
.bub-avatar .bub-ear { transform-box: view-box; animation: bub-ear 5.2s ease-in-out infinite; }
.bub-avatar .bub-zzz { animation: bub-zzz 2.8s ease-in-out infinite; }
.bub-avatar .bub-sparkle path { transform-box: fill-box; transform-origin: center; animation: bub-spark 1.6s ease-in-out infinite; }
.bub-avatar .bub-aura { animation: bub-aura 3s ease-in-out infinite; }
.bub-avatar .bub-tear { animation: bub-tear 1.8s ease-in-out infinite; }
.bub-avatar .bub-stink { animation: bub-zzz 2.2s ease-in-out infinite; }
.bub-avatar .bub-egg { transform-origin: 100px 166px; transform-box: view-box; animation: bub-wobble 3.4s ease-in-out infinite; }
.bub-avatar.bub-still * { animation: none !important; }
@keyframes bub-breathe { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.025) scaleX(0.995); } }
@keyframes bub-bounce { 0% { transform: scale(1); } 30% { transform: scale(1.08, 0.9) translateY(3px); } 65% { transform: scale(0.96, 1.06) translateY(-7px); } 100% { transform: scale(1); } }
@keyframes bub-blink { 0%, 93.5%, 97.5%, 100% { opacity: 0; } 94.5%, 96.5% { opacity: 1; } }
@keyframes bub-wag { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(7deg); } }
@keyframes bub-ear { 0%, 88%, 100% { transform: rotate(0deg); } 91% { transform: rotate(-4deg); } 94% { transform: rotate(2.5deg); } }
@keyframes bub-zzz { 0%,100% { transform: translateY(0); opacity: 0.9; } 50% { transform: translateY(-5px); opacity: 0.55; } }
@keyframes bub-spark { 0%,100% { transform: scale(0.75); opacity: 0.65; } 50% { transform: scale(1.15); opacity: 1; } }
@keyframes bub-aura { 0%,100% { opacity: 0.75; } 50% { opacity: 1; } }
@keyframes bub-tear { 0%,100% { transform: translateY(0); } 50% { transform: translateY(2.5px); } }
@keyframes bub-wobble { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-5deg); } 40% { transform: rotate(4deg); } 60% { transform: rotate(-2.5deg); } 80% { transform: rotate(1.5deg); } }
@media (prefers-reduced-motion: reduce) { .bub-avatar * { animation: none !important; } }
`;

/** Shared chunky body silhouette — same for every species. */
function Body({ base, dark, belly }: { base: string; dark: string; belly: string }) {
  return (
    <g>
      <path
        d="M 100 62 C 140 62 156 88 156 116 C 156 146 138 168 100 168 C 62 168 44 146 44 116 C 44 88 60 62 100 62 Z"
        fill={base} stroke={dark} strokeWidth={3.5} strokeLinejoin="round"
      />
      <ellipse cx={100} cy={141} rx={31} ry={22} fill={belly} />
      {/* front paws peeking out */}
      <ellipse cx={79} cy={164.5} rx={12.5} ry={8} fill={base} stroke={dark} strokeWidth={3} />
      <ellipse cx={121} cy={164.5} rx={12.5} ry={8} fill={base} stroke={dark} strokeWidth={3} />
    </g>
  );
}

function Egg({ speciesId }: { speciesId: PetAvatarProps['species'] }) {
  const def = SPECIES[speciesId];
  const p = def.palette;
  const Pattern = def.EggPattern;
  return (
    <g className="bub-egg">
      <path
        d="M 100 58 C 128 58 146 92 146 124 C 146 152 126 168 100 168 C 74 168 54 152 54 124 C 54 92 72 58 100 58 Z"
        fill="#FFFDF8" stroke={p.dark} strokeWidth={3.5}
      />
      <path d="M 100 58 C 128 58 146 92 146 124 C 146 152 126 168 100 168 C 74 168 54 152 54 124 C 54 92 72 58 100 58 Z"
        fill={p.base} opacity={0.25} />
      {Pattern && <Pattern p={p} stage="egg" />}
      <path d="M 68 84 Q 78 68 94 63" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
      {/* sleeping face on the shell — the Bublík inside is dreaming */}
      <g stroke={p.dark} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.75}>
        <path d="M 80 118 Q 86 122 92 118" />
        <path d="M 108 118 Q 114 122 120 118" />
        <path d="M 96 130 Q 100 133 104 130" />
      </g>
    </g>
  );
}

export function PetAvatar({
  species, stage, mood, outfit = {}, evolutionPath = null,
  size = 160, still = false, bounceKey = 0, className = '',
}: PetAvatarProps) {
  const def = SPECIES[species];
  const p = def.palette;
  const scale = STAGE_SCALE[stage];
  const faceShift = def.faceOffsetY ?? 0;

  // Effects follow mood + stage
  const effects = useMemo(() => {
    if (stage === 'egg') return null;
    return (
      <>
        {mood === 'sleeping' && <SleepZzz />}
        {mood === 'dirty' && <StinkSquiggles />}
        {(mood === 'ecstatic' || stage === 'legendary') && <JoySparkles />}
      </>
    );
  }, [mood, stage]);

  const { EarsBack, EarsFront, Tail, Extras, Snout, tailInFront } = def;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`bub-avatar ${still ? 'bub-still' : ''} ${className}`}
      role="img"
      aria-label={`${def.name} (${mood})`}
    >
      <style>{RIG_CSS}</style>

      {stage === 'egg' ? (
        <Egg speciesId={species} />
      ) : (
        <>
          {stage === 'legendary' && <LegendaryAura p={p} />}
          <g key={bounceKey} className={bounceKey > 0 ? 'bub-bounce' : undefined}>
            <g className="bub-anim-root">
              <g transform={`translate(${100 - 100 * scale} ${170 - 170 * scale}) scale(${scale})`}>
                {EarsBack && <EarsBack p={p} stage={stage} />}
                {Tail && !tailInFront && <Tail p={p} stage={stage} />}
                {outfit.back && <AccessoryLayer id={outfit.back} zone="back" p={p} />}

                <Body base={p.base} dark={p.dark} belly={p.belly} />

                {EarsFront && <EarsFront p={p} stage={stage} />}
                {Tail && tailInFront && <Tail p={p} stage={stage} />}
                {Extras && <Extras p={p} stage={stage} />}
                <BubbleShine />

                <g transform={faceShift ? `translate(0 ${faceShift})` : undefined}>
                  {Snout && <Snout p={p} stage={stage} />}
                  <Face mood={mood} p={p} />
                  <BlinkLids mood={mood} bodyFill={p.base} />
                  {outfit.face && mood !== 'vacation' && <AccessoryLayer id={outfit.face} zone="face" p={p} />}
                </g>

                {outfit.head
                  ? <AccessoryLayer id={outfit.head} zone="head" p={p} />
                  : <EvolutionProp path={evolutionPath} stage={stage} p={p} />}
                {outfit.neck && <AccessoryLayer id={outfit.neck} zone="neck" p={p} />}

                {effects}
              </g>
            </g>
          </g>
        </>
      )}
    </svg>
  );
}

/** Tiny still avatar for nav / lists / greetings. */
export function MiniPet(props: Omit<PetAvatarProps, 'size' | 'still'> & { size?: number }) {
  return <PetAvatar {...props} size={props.size ?? 48} still />;
}
