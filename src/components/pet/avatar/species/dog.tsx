// Pejsek — honey pup with floppy ears and a short hooked tail.
// Layers only: the shared body and face live in PetAvatar/parts — never redraw them.
// See cat.tsx for the reference implementation of this structure.
import type { LayerProps, SpeciesDef } from '../types';

const palette = {
  base: '#F6C983',
  dark: '#B9834A',
  belly: '#FBEBD3',
  accent: '#E8A85C',
};

/**
 * Floppy ears hanging beside the head, rooted on the top arc (~y 68) and
 * drooping to ~y 103. Drawn behind the body so only the outer lobe shows.
 * Babies get shorter, rounder lobes.
 */
function EarsBack({ p, stage }: LayerProps) {
  const small = stage === 'baby';
  const s = small ? 0.72 : 1;
  return (
    <g>
      <g className="bub-ear" style={{ transformOrigin: '72px 68px' }}>
        <path
          d={`M ${72 + 4 * s} ${68 + 4 * s} Q ${72 - 30 * s} ${68 - 2 * s} ${72 - 38 * s} ${68 + 20 * s} Q ${72 - 43 * s} ${68 + 36 * s} ${72 - 26 * s} ${68 + 35 * s} Q ${72 - 12 * s} ${68 + 31 * s} ${72 - 5 * s} ${68 + 14 * s} Q ${72 + 2 * s} ${68 + 6 * s} ${72 + 4 * s} ${68 + 4 * s} Z`}
          fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round"
        />
        {!small && (
          <path d="M 44 80 Q 37 90 39 100"
            fill="none" stroke={p.accent} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
        )}
      </g>
      <g className="bub-ear" style={{ transformOrigin: '128px 68px', animationDelay: '0.4s' }}>
        <path
          d={`M ${128 - 4 * s} ${68 + 4 * s} Q ${128 + 30 * s} ${68 - 2 * s} ${128 + 38 * s} ${68 + 20 * s} Q ${128 + 43 * s} ${68 + 36 * s} ${128 + 26 * s} ${68 + 35 * s} Q ${128 + 12 * s} ${68 + 31 * s} ${128 + 5 * s} ${68 + 14 * s} Q ${128 - 2 * s} ${68 + 6 * s} ${128 - 4 * s} ${68 + 4 * s} Z`}
          fill={p.base} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round"
        />
        {!small && (
          <path d="M 156 80 Q 163 90 161 100"
            fill="none" stroke={p.accent} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
        )}
      </g>
    </g>
  );
}

/** Short tail hooking up on the right, wagging from the body edge. */
function Tail({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.7 : 1;
  const d = `M 146 152 Q ${146 + 20 * s} ${152 - 4 * s} ${146 + 22 * s} ${152 - 24 * s}`;
  return (
    <g className="bub-tail" style={{ transformOrigin: '146px 148px' }}>
      <path d={d} fill="none" stroke={p.base} strokeWidth={12 * s} strokeLinecap="round" />
      {/* soft fur crease instead of a hard outline */}
      <path d={d} fill="none" stroke={p.dark} strokeWidth={3} strokeLinecap="round" opacity={0.32} />
      <circle cx={146 + 22 * s} cy={152 - 24 * s} r={7 * s} fill={p.belly} stroke={p.dark} strokeWidth={2.6} />
    </g>
  );
}

/** Pale muzzle + round nose. The shared mouth is drawn on top of the muzzle. */
function Snout({ p, stage }: LayerProps) {
  const s = stage === 'baby' ? 0.78 : 1;
  return (
    <g>
      <ellipse cx={100} cy={122} rx={16 * s} ry={11 * s} fill={p.belly} stroke={p.dark} strokeWidth={3} />
      <ellipse cx={100} cy={114} rx={6.6 * s} ry={5.2 * s} fill={p.dark} />
      <ellipse cx={102} cy={112.4} rx={1.9 * s} ry={1.3 * s} fill="#FFFFFF" opacity={0.55} />
      {/* freckles sit on the cheeks, clear of the muzzle rim */}
      {stage !== 'baby' && (
        <g fill={p.dark} opacity={0.5}>
          <circle cx={76} cy={115} r={1.6} />
          <circle cx={73} cy={120} r={1.6} />
          <circle cx={76} cy={125} r={1.6} />
          <circle cx={124} cy={115} r={1.6} />
          <circle cx={127} cy={120} r={1.6} />
          <circle cx={124} cy={125} r={1.6} />
        </g>
      )}
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
  Tail,
  Snout,
  EggPattern,
};
