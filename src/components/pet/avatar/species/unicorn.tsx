// Jednorožec — pearl-white unicorn: golden horn, pastel rainbow mane and a
// flowing rainbow tail. Body and face come from the rig (see cat.tsx for the
// reference implementation) — never redraw them here.
import type { LayerProps, SpeciesDef } from '../types';

// Base must stay clearly visible on white cards — lavender-tinged white,
// with a stronger periwinkle outline (pure #FBF8FF vanished on --bg-card).
const palette = {
  base: '#EFE9FC',
  dark: '#A48FD8',
  belly: '#FDFCFF',
  accent: '#FBBF24',
  extra: '#F9A8D4',
};

/** Warm gold for the horn outline + stripes — palette.dark is far too pale here. */
const HORN_DARK = '#D97706';

// Rainbow strands, ordered inner → outer (the inner pink one is drawn last).
// The inner strand rides the head silhouette so it reads as a rim of hair,
// and every strand ends tucked under the body.
const MANE_STRANDS = [
  { c: '#F9A8D4', w: 12, d: 'M 86 57 Q 64 62 52 80 Q 42 100 45 122 Q 48 138 58 146' },
  { c: '#C4B5FD', w: 10, d: 'M 78 55 Q 54 62 42 82 Q 32 102 35 126 Q 38 142 48 150' },
  { c: '#86EFAC', w: 8, d: 'M 70 55 Q 46 64 33 84 Q 24 104 27 128 Q 30 144 40 152' },
];

const TAIL_STRANDS = [
  { c: '#F9A8D4', w: 11, d: 'M 150 148 Q 174 146 178 122 Q 180 106 172 96' },
  { c: '#C4B5FD', w: 9, d: 'M 150 154 Q 176 154 181 132 Q 184 116 177 104' },
  { c: '#86EFAC', w: 7, d: 'M 150 160 Q 174 164 179 144 Q 182 128 176 116' },
];

/** Mane down the left side + small pointed ears, all behind the body. */
function EarsBack({ p, stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.72 : 1;
  const strands = small ? MANE_STRANDS.slice(0, 1) : MANE_STRANDS;

  // pointed ear built around its base mid-point (mx, 72)
  const ear = (mx: number, dir: number) =>
    `M ${mx + 8 * s * dir} ${72 - 4 * s} L ${mx - 4 * s * dir} ${72 - 28 * s} L ${mx - 8 * s * dir} ${72 + 4 * s} Z`;

  return (
    <g>
      <g transform={small ? `translate(${70 - 70 * s} ${62 - 62 * s}) scale(${s})` : undefined}>
        {[...strands].reverse().map(strand => (
          <path
            key={strand.c} d={strand.d} fill="none"
            stroke={strand.c} strokeWidth={strand.w} strokeLinecap="round"
          />
        ))}
      </g>
      <g className="bub-ear" style={{ transformOrigin: '70px 72px' }}>
        <path d={ear(70, 1)} fill={p.base} stroke={p.dark} strokeWidth={3.2} strokeLinejoin="round" />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '130px 72px', animationDelay: '0.45s' }}>
        <path d={ear(130, -1)} fill={p.base} stroke={p.dark} strokeWidth={3.2} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** The horn — a mini nub on babies, full spiral-striped horn from child up. */
function Extras({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.55 : 1;
  return (
    <g transform={s === 1 ? undefined : `translate(${94 - 94 * s} ${63 - 63 * s}) scale(${s})`}>
      <path
        d="M 88 64 L 90 30 L 100 62.5 Z"
        fill={p.accent} stroke={HORN_DARK} strokeWidth={3} strokeLinejoin="round"
      />
      <g stroke={HORN_DARK} strokeWidth={2} strokeLinecap="round" fill="none">
        <path d="M 90.8 48 L 94.2 46.6" />
        <path d="M 90.4 38.5 L 92 37.6" />
      </g>
    </g>
  );
}

/** Rainbow tail — three soft strands swishing together. */
function Tail({ stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.72 : 1;
  return (
    <g className="bub-tail" style={{ transformOrigin: '150px 152px' }}>
      <g transform={small ? `translate(${150 - 150 * s} ${152 - 152 * s}) scale(${s})` : undefined}>
        {[...TAIL_STRANDS].reverse().map(strand => (
          <path
            key={strand.c} d={strand.d} fill="none"
            stroke={strand.c} strokeWidth={strand.w} strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
}

/** Barely-there nostrils. */
function Snout({ p }: LayerProps) {
  return (
    <g fill={p.dark} opacity={0.5}>
      <ellipse cx={95.5} cy={116} rx={2.2} ry={1.7} />
      <ellipse cx={104.5} cy={116} rx={2.2} ry={1.7} />
    </g>
  );
}

/** Egg sprinkled with little stars and hearts. */
function EggPattern() {
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const heart = (cx: number, cy: number, r: number) =>
    `M ${cx} ${cy + r * 0.8} C ${cx - r * 1.4} ${cy - r * 0.3} ${cx - r} ${cy - r * 1.6} ${cx} ${cy - r * 0.6}`
    + ` C ${cx + r} ${cy - r * 1.6} ${cx + r * 1.4} ${cy - r * 0.3} ${cx} ${cy + r * 0.8} Z`;
  return (
    // kept clear of the shell's sleeping face (x 76–124, y 110–136)
    <g opacity={0.8}>
      <polygon points={star(82, 90, 8)} fill="#F9A8D4" />
      <polygon points={star(130, 104, 7)} fill="#C4B5FD" />
      <polygon points={star(96, 150, 6.5)} fill="#F9A8D4" />
      <path d={heart(114, 84, 6)} fill="#C4B5FD" />
      <path d={heart(68, 130, 6.5)} fill="#F9A8D4" />
      <path d={heart(122, 132, 5.5)} fill="#C4B5FD" />
    </g>
  );
}

export const unicorn: SpeciesDef = {
  id: 'unicorn',
  name: 'Jednorožec',
  palette,
  EarsBack,
  Tail,
  Extras,
  Snout,
  EggPattern,
};
