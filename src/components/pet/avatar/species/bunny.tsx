// Králíček — lavender bunny with tall ears (the right one folds over) and a pom-pom tail.
// Layers only: the shared body and face live in PetAvatar/parts — never redraw them.
// See cat.tsx for the reference implementation of this structure.
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#C9BCFA',
  dark: '#8B78D0',
  belly: '#EAE5FE',
  accent: '#F8C4E6',
};

/**
 * Tall ears rooted on the head arc (~y 70) reaching up to ~y 14.
 * From child up the right ear folds over in its upper third; babies keep
 * two short upright ears.
 */
function EarsBack({ p, stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.55 : 1;
  // upright ear, mirrored around x = 100 via `dir`
  const upright = (ax: number, dir: 1 | -1) =>
    `M ${ax - 6 * s * dir} ${70 + 2 * s} Q ${ax - 16 * s * dir} ${70 - 26 * s} ${ax - 16 * s * dir} ${70 - 48 * s} Q ${ax - 12 * s * dir} ${70 - 60 * s} ${ax - 2 * s * dir} ${70 - 54 * s} Q ${ax + 4 * s * dir} ${70 - 36 * s} ${ax + 8 * s * dir} ${70 + 2 * s} Z`;
  return (
    <g>
      <g className="bub-ear" style={{ transformOrigin: '78px 70px' }}>
        <path d={upright(78, 1)} fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round" />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '122px 70px', animationDelay: '0.4s' }}>
        <path
          d={small
            ? upright(122, -1)
            : 'M 131 72 Q 143 50 142 34 Q 141 21 152 20 Q 163 20 157 32 Q 152 42 139 42 Q 125 42 120 56 Q 117 64 113 72 Z'}
          fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

/** Soft pink ear insides, drawn over the ear roots. */
function EarsFront({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    <g fill={p.accent} opacity={0.6}>
      <path d="M 70 64 Q 64 42 68 28 Q 71 20 75 28 Q 79 44 79 64 Z" />
      <path d="M 127 62 Q 129 46 133 37 Q 136 30 143 30 Q 148 31 145 36 Q 139 40 136 48 Q 133 55 134 62 Z" />
    </g>
  );
}

/** Fluffy pom-pom tail peeking out on the lower left. */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.75 : 1;
  return (
    <g className="bub-tail" style={{ transformOrigin: '54px 150px' }}>
      {/* small puffs first so the main pom-pom covers their inner outlines */}
      <circle cx={54 - 16 * s} cy={150 - 9 * s} r={5 * s} fill={p.belly} stroke={p.dark} strokeWidth={2.4} />
      <circle cx={54 - 15 * s} cy={150 + 9 * s} r={4.2 * s} fill={p.belly} stroke={p.dark} strokeWidth={2.4} />
      <circle cx={54 - 10 * s} cy={150} r={11 * s} fill={p.belly} stroke={p.dark} strokeWidth={3} />
    </g>
  );
}

/** Y-shaped bunny nose (triangle + philtrum) and cheek whisker dots. */
function Snout({ p, stage }: LayerProps) {
  return (
    <g>
      <path d="M 94 112 Q 100 109.5 106 112 Q 103 119 100 119 Q 97 119 94 112 Z"
        fill={p.accent} stroke={p.dark} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M 100 119 L 100 124" stroke={p.dark} strokeWidth={2} strokeLinecap="round" />
      {stage !== 'baby' && (
        <g fill={p.dark} opacity={0.5}>
          <circle cx={70} cy={112} r={1.5} />
          <circle cx={67} cy={117} r={1.5} />
          <circle cx={70} cy={122} r={1.5} />
          <circle cx={130} cy={112} r={1.5} />
          <circle cx={133} cy={117} r={1.5} />
          <circle cx={130} cy={122} r={1.5} />
        </g>
      )}
    </g>
  );
}

/** Zigzag-striped egg. */
function EggPattern({ p }: LayerProps) {
  return (
    <g fill="none" stroke={p.base} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.8}>
      <path d="M 66 92 L 78 84 L 90 92 L 102 84 L 114 92 L 126 84 L 133 90" />
      <path d="M 72 150 L 84 143 L 96 150 L 108 143 L 120 150 L 128 145" />
    </g>
  );
}

export const bunny: SpeciesDef = {
  id: 'bunny',
  name: 'Králíček',
  palette,
  EarsBack,
  EarsFront,
  Tail,
  Snout,
  EggPattern,
};
