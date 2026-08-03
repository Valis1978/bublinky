// Dráček — mint dragon: rounded crown horns, little flapping wings,
// a dorsal crest and an arrow-tipped tail. Body and face come from the rig
// (see cat.tsx for the reference implementation) — never redraw them here.
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#8FE7B0',
  dark: '#3FA968',
  belly: '#DCFBE7',
  accent: '#34D399',
  extra: '#6EE7B7',
};

/** Smoke tone — soft grey, deliberately outside the species palette. */
const SMOKE = '#94A3B8';

/**
 * Behind the body: two rounded horns sitting on the crown (their bases tuck
 * under the head silhouette) plus small rounded wings at the flanks.
 */
function EarsBack({ p, stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.72 : 1;

  // horn grows from a base centered on (cx, 70); dir mirrors it to the right side
  const horn = (cx: number, dir: number) =>
    `M ${cx - 7 * s * dir} ${70} Q ${cx - 11 * s * dir} ${70 - 24 * s} ${cx - 1 * s * dir} ${70 - 26 * s}`
    + ` Q ${cx + 8 * s * dir} ${70 - 24 * s} ${cx + 7 * s * dir} ${70 - 2 * s} Z`;

  // wing rooted at (rx, 122) with two rounded scallops on the trailing edge
  const wing = (rx: number, dir: number) =>
    `M ${rx} ${122 + 2 * s} Q ${rx + 26 * s * dir} ${122 - 2 * s} ${rx + 25 * s * dir} ${122 - 26 * s}`
    + ` Q ${rx + 22 * s * dir} ${122 - 10 * s} ${rx + 12 * s * dir} ${122 - 14 * s}`
    + ` Q ${rx + 10 * s * dir} ${122 - 4 * s} ${rx} ${122 - 6 * s} Z`;

  return (
    <g>
      <g fill={p.accent} stroke={p.dark} strokeWidth={3} strokeLinejoin="round">
        <path d={horn(81, 1)} />
        <path d={horn(119, -1)} />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '52px 120px' }}>
        <path d={wing(50, -1)} fill={p.extra} stroke={p.dark} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <g className="bub-ear" style={{ transformOrigin: '148px 120px', animationDelay: '0.5s' }}>
        <path d={wing(150, 1)} fill={p.extra} stroke={p.dark} strokeWidth={3} strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** Three little rounded spikes riding the crown between the horns. */
function Extras({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.66 : 1;
  // open path: the fill closes the base, the stroke only outlines the dome
  const spike = (cx: number, baseY: number, h: number) =>
    `M ${cx - 4.5 * s} ${baseY} Q ${cx} ${baseY - h * s} ${cx + 4.5 * s} ${baseY}`;
  return (
    <g fill={p.accent} stroke={p.dark} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d={spike(91, 63.4, 11)} />
      <path d={spike(100, 62.6, 13.5)} />
      <path d={spike(109, 63.4, 11)} />
    </g>
  );
}

/** Tail with an arrow-shaped tip, wagging from the hip. */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;
  const d = `M 146 154 Q ${146 + 26 * s} ${154 + 4 * s} ${146 + 30 * s} ${154 - 16 * s}`;
  return (
    <g className="bub-tail" style={{ transformOrigin: '148px 150px' }}>
      <path d={d} fill="none" stroke={p.dark} strokeWidth={15 * s} strokeLinecap="round" />
      <path d={d} fill="none" stroke={p.base} strokeWidth={11 * s} strokeLinecap="round" />
      <path
        d={`M ${146 + 32 * s} ${154 - 27 * s} L ${146 + 37.8 * s} ${154 - 14.4 * s} L ${146 + 22.2 * s} ${154 - 17.6 * s} Z`}
        fill={p.accent} stroke={p.dark} strokeWidth={2.8} strokeLinejoin="round"
      />
    </g>
  );
}

/** Nostrils, plus a lazy puff of smoke once the dragon is old enough. */
function Snout({ p, stage }: LayerProps) {
  return (
    <g>
      <g fill={p.dark}>
        <ellipse cx={95} cy={115} rx={2.4} ry={1.9} />
        <ellipse cx={105} cy={115} rx={2.4} ry={1.9} />
      </g>
      {stage !== 'baby' && (
        <g fill={SMOKE} opacity={0.35}>
          <circle cx={152} cy={96} r={5.5} />
          <circle cx={158.5} cy={89} r={4} />
        </g>
      )}
    </g>
  );
}

/** Scaly egg — three rows of little shells. */
function EggPattern({ p }: LayerProps) {
  const scale = (cx: number, cy: number, w: number) =>
    `M ${cx - w} ${cy} Q ${cx} ${cy + w * 1.35} ${cx + w} ${cy} Z`;
  return (
    // staggered so the rows never line up with the shell's sleeping face
    <g fill={p.base} opacity={0.8}>
      <path d={scale(72, 100, 9)} />
      <path d={scale(94, 92, 9)} />
      <path d={scale(116, 98, 8)} />
      <path d={scale(64, 128, 8)} />
      <path d={scale(132, 118, 8)} />
      <path d={scale(86, 138, 9)} />
      <path d={scale(112, 132, 9)} />
    </g>
  );
}

export const dragon: SpeciesDef = {
  id: 'dragon',
  name: 'Dráček',
  palette,
  EarsBack,
  Tail,
  Extras,
  Snout,
  EggPattern,
};
