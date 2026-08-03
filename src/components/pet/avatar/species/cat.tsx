// Kočička — REFERENCE species implementation.
// Read this file before writing a new species: it shows stage-aware features,
// the .bub-tail / .bub-ear animation groups with inline transform origins,
// and how layers sit around the shared body (never redraw body or face).
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#F8B4D4',
  dark: '#C2648F',
  belly: '#FDE4EF',
  accent: '#F472B6',
};

/** Outer ears behind the body. Babies get smaller, rounder ears. */
function EarsBack({ p, stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.72 : 1;
  return (
    <g>
      <g className="bub-ear" style={{ transformOrigin: '70px 74px' }}>
        <path
          d={`M ${70 - 20 * s} ${74 + 6 * s} Q ${68 - 14 * s} ${74 - 26 * s} ${70 + 8 * s} ${74 - 8 * s} Z`}
          fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round"
        />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '130px 74px', animationDelay: '0.4s' }}>
        <path
          d={`M ${130 + 20 * s} ${74 + 6 * s} Q ${132 + 14 * s} ${74 - 26 * s} ${130 - 8 * s} ${74 - 8 * s} Z`}
          fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

/** Inner-ear detail drawn over the body edge. */
function EarsFront({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    <g fill={p.accent} opacity={0.55}>
      <path d="M 57 70 Q 58 56 66 62 Q 63 68 61 72 Z" />
      <path d="M 143 70 Q 142 56 134 62 Q 137 68 139 72 Z" />
    </g>
  );
}

/** Curled tail, wagging from its base at the body edge. */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;
  return (
    <g className="bub-tail" style={{ transformOrigin: '148px 150px' }}>
      <path
        d={`M 148 152 Q ${172 + 8 * s} ${144 - 6 * s} ${168 + 6 * s} ${118 - 10 * s} Q ${165 + 4 * s} ${102 - 10 * s} ${152} ${106 - 6 * s}`}
        fill="none" stroke={p.base} strokeWidth={13 * s} strokeLinecap="round"
      />
      <path
        d={`M 148 152 Q ${172 + 8 * s} ${144 - 6 * s} ${168 + 6 * s} ${118 - 10 * s} Q ${165 + 4 * s} ${102 - 10 * s} ${152} ${106 - 6 * s}`}
        fill="none" stroke={p.dark} strokeWidth={13 * s + 5} strokeLinecap="round" opacity={0}
      />
      {/* outline pass: redraw slightly wider underneath is unreliable — use two strokes */}
      <path
        d={`M 148 152 Q ${172 + 8 * s} ${144 - 6 * s} ${168 + 6 * s} ${118 - 10 * s} Q ${165 + 4 * s} ${102 - 10 * s} ${152} ${106 - 6 * s}`}
        fill="none" stroke={p.dark} strokeWidth={3} strokeLinecap="round"
        strokeDasharray="none" opacity={0.35}
      />
      {/* tail tip */}
      <circle cx={152 + 0} cy={106 - 6 * s} r={7.5 * s} fill={p.accent} stroke={p.dark} strokeWidth={2.6} />
    </g>
  );
}

/** Nose + whiskers over the face baseline. */
function Snout({ p, stage }: LayerProps) {
  return (
    <g>
      <path d="M 96 115 Q 100 112.5 104 115 Q 102.5 119.5 100 119.5 Q 97.5 119.5 96 115 Z"
        fill={p.accent} stroke={p.dark} strokeWidth={1.6} strokeLinejoin="round" />
      {stage !== 'baby' && (
        <g stroke={p.dark} strokeWidth={1.8} strokeLinecap="round" opacity={0.55}>
          <path d="M 54 112 L 38 108" />
          <path d="M 55 119 L 39 120" />
          <path d="M 146 112 L 162 108" />
          <path d="M 145 119 L 161 120" />
        </g>
      )}
    </g>
  );
}

/** Polka-dot egg. */
function EggPattern({ p }: LayerProps) {
  return (
    <g fill={p.base} opacity={0.8}>
      <circle cx={82} cy={92} r={6} />
      <circle cx={118} cy={84} r={4.5} />
      <circle cx={130} cy={116} r={5.5} />
      <circle cx={70} cy={128} r={4.5} />
      <circle cx={104} cy={150} r={5} />
    </g>
  );
}

export const cat: SpeciesDef = {
  id: 'cat',
  name: 'Kočička',
  palette,
  EarsBack,
  EarsFront,
  Tail,
  Snout,
  EggPattern,
};
