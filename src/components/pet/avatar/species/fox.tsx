// Lištička — coral fox: big dark-tipped ears, cheek ruff, cream muzzle and the
// signature huge bushy tail. Body and face come from the rig (see cat.tsx for
// the reference implementation) — never redraw them here.
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#FCA57E',
  dark: '#C56A45',
  belly: '#FEF3E7',
  accent: '#F87F5A',
  extra: '#FEF3E7',
};

/** Big pointed ears with darker tips. Babies get noticeably smaller ones. */
function EarsBack({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;

  // ear triangle around its base mid-point (mx, 74): inner base → tip → outer base
  const ear = (mx: number, dir: number) =>
    `M ${mx + 11 * s * dir} ${74 - 8 * s} L ${mx - 7 * s * dir} ${74 - 42 * s} L ${mx - 11 * s * dir} ${74 + 8 * s} Z`;
  // top slice of the same triangle — the dark tip cap
  const tip = (mx: number, dir: number) =>
    `M ${mx - 7 * s * dir} ${74 - 42 * s} L ${mx + 0.2 * s * dir} ${74 - 28.4 * s} L ${mx - 8.6 * s * dir} ${74 - 22 * s} Z`;

  return (
    <g>
      <g className="bub-ear" style={{ transformOrigin: '65px 74px' }}>
        <path d={ear(65, 1)} fill={p.base} stroke={p.dark} strokeWidth={3.4} strokeLinejoin="round" />
        <path d={tip(65, 1)} fill={p.dark} stroke={p.dark} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '135px 74px', animationDelay: '0.42s' }}>
        <path d={ear(135, -1)} fill={p.base} stroke={p.dark} strokeWidth={3.4} strokeLinejoin="round" />
        <path d={tip(135, -1)} fill={p.dark} stroke={p.dark} strokeWidth={2.4} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** Cream inner ears, drawn over the body edge. */
function EarsFront({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    <g fill={p.belly} opacity={0.7}>
      <path d="M 70.7 63.6 L 61.5 53 L 57.5 73.2 Z" />
      <path d="M 129.3 63.6 L 138.5 53 L 142.5 73.2 Z" />
    </g>
  );
}

/** Fluffy cheek tufts hugging the silhouette. */
function Extras({ p, stage }: LayerProps) {
  if (stage === 'baby') return null;
  return (
    // open paths: the fill closes them under the body, the stroke only draws
    // the visible zig-zag, so the ruff reads as one fluffy edge
    <g fill={p.belly} stroke={p.dark} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
      <path d="M 48 96 L 33 104 L 45.5 109 L 31 117 L 45 123 L 33 131 L 48 134" />
      <path d="M 152 96 L 167 104 L 154.5 109 L 169 117 L 155 123 L 167 131 L 152 134" />
    </g>
  );
}

/** The signature tail: huge, bushy, curled up along the right flank. */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;
  // everything scales toward the hip anchor (150,156)
  const d = `M 150 156 Q ${150 + 27 * s} ${156 - 6 * s} ${150 + 24 * s} ${156 - 38 * s}`
    + ` Q ${150 + 22 * s} ${156 - 64 * s} ${150 + 8 * s} ${156 - 71 * s}`;
  const tip = `M ${150 + 22 * s} ${156 - 56 * s} Q ${150 + 19 * s} ${156 - 66 * s} ${150 + 8 * s} ${156 - 71 * s}`;
  return (
    <g className="bub-tail" style={{ transformOrigin: '150px 152px' }}>
      <path d={d} fill="none" stroke={p.dark} strokeWidth={28 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={p.base} strokeWidth={24 * s} strokeLinecap="round" />
      <path d={tip} fill="none" stroke={p.dark} strokeWidth={26 * s} strokeLinecap="round" />
      <path d={tip} fill="none" stroke={p.belly} strokeWidth={22 * s} strokeLinecap="round" />
    </g>
  );
}

/** Cream muzzle wedge with a little dark nose on top. */
function Snout({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.82 : 1;
  return (
    <g transform={s === 1 ? undefined : `translate(${100 - 100 * s} ${120 - 120 * s}) scale(${s})`}>
      <path
        d="M 82 114 Q 100 110 118 114 Q 112 131 100 134 Q 88 131 82 114 Z"
        fill={p.belly} stroke={p.dark} strokeOpacity={0.4} strokeWidth={2} strokeLinejoin="round"
      />
      <circle cx={100} cy={114} r={3.2} fill={p.dark} />
    </g>
  );
}

/** Egg dressed in little triangles. */
function EggPattern({ p }: LayerProps) {
  const tri = (cx: number, cy: number, r: number) =>
    `M ${cx} ${cy - r} L ${cx + r * 0.92} ${cy + r * 0.72} L ${cx - r * 0.92} ${cy + r * 0.72} Z`;
  return (
    // scattered around the shell's sleeping face, never on top of it
    <g opacity={0.7}>
      <path d={tri(80, 92, 11)} fill={p.base} />
      <path d={tri(112, 86, 9)} fill={p.accent} />
      <path d={tri(64, 124, 9)} fill={p.accent} />
      <path d={tri(134, 116, 9)} fill={p.base} />
      <path d={tri(96, 148, 10)} fill={p.accent} />
      <path d={tri(124, 142, 8)} fill={p.base} />
    </g>
  );
}

export const fox: SpeciesDef = {
  id: 'fox',
  name: 'Lištička',
  palette,
  EarsBack,
  EarsFront,
  Tail,
  Extras,
  Snout,
  EggPattern,
};
