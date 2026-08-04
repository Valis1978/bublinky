// Pejsek — shiba inu, drawn after Sakio (Viki's real dog).
// Signature shiba features: small upright triangular ears, the tightly CURLED
// tail over the back, cream "urajiro" muzzle + cheek patches and the little
// cream eyebrow dots above the eyes.
// Layers only: the shared body and face live in PetAvatar/parts — never redraw
// them. See cat.tsx for the reference implementation of this structure.
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#F0A264',   // shiba red
  dark: '#B06F3C',
  belly: '#FDF3E3',  // urajiro cream
  accent: '#E08B4C',
};

/**
 * Upright triangular ears on the top arc — smaller and rounder than the fox's,
 * tilted slightly outward. Babies get stubby folded-looking triangles.
 */
function EarsBack({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.66 : 1;
  // triangle around its base mid-point (mx, 72): inner base → tip → outer base
  const ear = (mx: number, dir: number) =>
    `M ${mx + 12 * s * dir} ${72 + 2 * s}`
    + ` Q ${mx + 8 * s * dir} ${72 - 26 * s} ${mx - 3 * s * dir} ${72 - 30 * s}`
    + ` Q ${mx - 10 * s * dir} ${72 - 18 * s} ${mx - 12 * s * dir} ${72 + 6 * s} Z`;
  return (
    <g>
      <g className="bub-ear" style={{ transformOrigin: '68px 72px' }}>
        <path d={ear(68, 1)} fill={p.base} stroke={p.dark} strokeWidth={3.4} strokeLinejoin="round" />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '132px 72px', animationDelay: '0.4s' }}>
        <path d={ear(132, -1)} fill={p.base} stroke={p.dark} strokeWidth={3.4} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** Cream inner-ear triangles over the body edge, from child up. */
function EarsFront({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    <g fill={p.belly} opacity={0.75}>
      <path d="M 74 66 Q 71 52 65 48 Q 61 58 60 68 Z" />
      <path d="M 126 66 Q 129 52 135 48 Q 139 58 140 68 Z" />
    </g>
  );
}

/**
 * The shiba curl — a cinnamon-roll tail resting visibly ON the back edge
 * (rendered in front of the body), cream on the inner curl. Rocks gently.
 */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;
  // curl disc straddling the top-right body edge
  const cx = 100 + 50 * s;
  const cy = 152 - 66 * s;
  return (
    <g className="bub-tail" style={{ transformOrigin: `${cx - 6 * s}px ${cy + 13 * s}px` }}>
      <circle cx={cx} cy={cy} r={13.5 * s} fill={p.base} stroke={p.dark} strokeWidth={3.2} />
      {/* inner cream swirl */}
      <path
        d={`M ${cx + 7 * s} ${cy - 2 * s} A ${7.5 * s} ${7.5 * s} 0 1 1 ${cx - 2 * s} ${cy - 7 * s}`}
        fill="none" stroke={p.belly} strokeWidth={5.5 * s} strokeLinecap="round"
      />
      <circle cx={cx + 1.5 * s} cy={cy + 1.5 * s} r={2.6 * s} fill={p.belly} />
    </g>
  );
}

/** Urajiro cheek patches hugging the face sides — smooth, not spiky. */
function Extras({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    <g fill={p.belly} opacity={0.85}>
      <path d="M 46 106 Q 38 118 46 130 Q 56 134 62 128 Q 58 114 54 106 Q 50 103 46 106 Z" />
      <path d="M 154 106 Q 162 118 154 130 Q 144 134 138 128 Q 142 114 146 106 Q 150 103 154 106 Z" />
    </g>
  );
}

/**
 * Urajiro muzzle + round black nose + the signature cream eyebrow dots.
 * The shared mouth from the face layer is drawn on top of the muzzle.
 */
function Snout({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.78 : 1;
  return (
    <g>
      <ellipse cx={100} cy={122} rx={16 * s} ry={11 * s} fill={p.belly} stroke={p.dark} strokeOpacity={0.45} strokeWidth={2.4} />
      <ellipse cx={100} cy={114} rx={6 * s} ry={4.8 * s} fill="#4A3628" />
      <ellipse cx={102} cy={112.6} rx={1.8 * s} ry={1.2 * s} fill="#FFFFFF" opacity={0.55} />
      {/* cream eyebrow dots — THE shiba detail */}
      <g fill={p.belly} stroke={p.dark} strokeOpacity={0.25} strokeWidth={1.2}>
        <ellipse cx={78} cy={91.5} rx={4.6 * s} ry={3.4 * s} />
        <ellipse cx={122} cy={91.5} rx={4.6 * s} ry={3.4 * s} />
      </g>
    </g>
  );
}

/** Paw-print egg. */
function EggPattern({ p }: LayerProps) {
  const paw = (cx: number, cy: number, k: number) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={6 * k} ry={5.2 * k} />
      <circle cx={cx - 6.4 * k} cy={cy - 6 * k} r={2.3 * k} />
      <circle cx={cx} cy={cy - 8.6 * k} r={2.5 * k} />
      <circle cx={cx + 6.4 * k} cy={cy - 6 * k} r={2.3 * k} />
    </g>
  );
  return (
    <g fill={p.base} opacity={0.8}>
      {paw(80, 93, 1)}
      {paw(120, 146, 0.8)}
    </g>
  );
}

export const dog: SpeciesDef = {
  id: 'dog',
  name: 'Pejsek',
  palette,
  EarsBack,
  EarsFront,
  Tail,
  tailInFront: true,
  Extras,
  Snout,
  EggPattern,
};
