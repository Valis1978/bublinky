// Accessory + evolution-prop visuals. Anchors (see types.ts):
// head-top (100, 62) · face/eyes y 104 · neck (100, 158) · back (150, 118)
import type { EvolutionPath, PetStage } from '@/lib/pet-engine';
import { EYE_DARK, type AccessorySlot, type SpeciesPalette } from './types';

interface AccProps { p: SpeciesPalette }

// ————————————————————————————— head slot —————————————————————————————

function Cap(_: AccProps) {
  return (
    <g>
      <path d="M 70 66 Q 100 38 130 66 L 130 72 Q 100 60 70 72 Z" fill="#F472B6" stroke="#C2508D" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 126 64 Q 152 62 156 72 Q 132 74 127 71 Z" fill="#F9A8D4" stroke="#C2508D" strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={100} cy={46} r={4.5} fill="#FDE7F1" stroke="#C2508D" strokeWidth={2} />
    </g>
  );
}

function Bow(_: AccProps) {
  return (
    <g transform="rotate(-12 128 62)">
      <path d="M 128 62 L 108 50 Q 102 62 108 74 Z" fill="#F472B6" stroke="#C2508D" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 128 62 L 148 50 Q 154 62 148 74 Z" fill="#F472B6" stroke="#C2508D" strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={128} cy={62} r={6.5} fill="#FDA4AF" stroke="#C2508D" strokeWidth={2.4} />
    </g>
  );
}

function Crown(_: AccProps) {
  return (
    <g>
      <path d="M 78 62 L 82 40 L 93 54 L 100 36 L 107 54 L 118 40 L 122 62 Q 100 68 78 62 Z"
        fill="#FBBF24" stroke="#D97706" strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={82} cy={40} r={3.4} fill="#F472B6" />
      <circle cx={100} cy={36} r={3.4} fill="#86EFAC" />
      <circle cx={118} cy={40} r={3.4} fill="#C4B5FD" />
    </g>
  );
}

function FlowerClip(_: AccProps) {
  const petal = (a: number) =>
    `rotate(${a} 130 58)`;
  return (
    <g>
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx={130} cy={49} rx={5.2} ry={7.5} fill="#C4B5FD" stroke="#8B78D0" strokeWidth={1.6} transform={petal(a)} />
      ))}
      <circle cx={130} cy={58} r={5} fill="#FBBF24" stroke="#D97706" strokeWidth={1.6} />
    </g>
  );
}

function WizardHat(_: AccProps) {
  return (
    <g transform="rotate(6 100 52)">
      <path d="M 74 64 Q 100 72 126 64 Q 128 70 124 72 Q 100 80 76 72 Q 72 70 74 64 Z" fill="#7C6AD8" stroke="#5B4AB5" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 80 66 Q 92 26 104 14 Q 106 34 120 65 Q 100 72 80 66 Z" fill="#8B78E8" stroke="#5B4AB5" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 90 52 l 3.5 -7 l 3.5 7 l -7 0 Z M 104 38 l 3 -6 l 3 6 l -6 0 Z" fill="#FBBF24" />
      <circle cx={104} cy={13} r={4} fill="#FBBF24" stroke="#D97706" strokeWidth={1.8} />
    </g>
  );
}

// ————————————————————————————— face slot —————————————————————————————

function Glasses(_: AccProps) {
  return (
    <g stroke={EYE_DARK} strokeWidth={2.8} fill="none">
      <circle cx={78} cy={104} r={13} />
      <circle cx={122} cy={104} r={13} />
      <path d="M 91 104 Q 100 100 109 104" />
      <path d="M 65 102 L 56 98 M 135 102 L 144 98" strokeLinecap="round" />
    </g>
  );
}

function SunglassesAcc(p: AccProps) {
  return (
    <g>
      <path d="M 62 100 H 138" stroke={p.p.dark} strokeWidth={3} strokeLinecap="round" />
      <rect x={64} y={98} width={28} height={16} rx={8} fill={EYE_DARK} />
      <rect x={108} y={98} width={28} height={16} rx={8} fill={EYE_DARK} />
    </g>
  );
}

// ————————————————————————————— neck slot —————————————————————————————

function Scarf(_: AccProps) {
  return (
    <g>
      <path d="M 58 148 Q 100 166 142 148 L 142 158 Q 100 176 58 158 Z" fill="#FDA4AF" stroke="#D66A78" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 118 160 L 124 184 Q 114 188 108 182 L 110 162 Z" fill="#FDA4AF" stroke="#D66A78" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 110 176 H 121 M 111 169 H 120" stroke="#D66A78" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

function Medal(_: AccProps) {
  return (
    <g>
      <path d="M 84 150 L 100 168 L 116 150" stroke="#F472B6" strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={100} cy={172} r={10} fill="#FBBF24" stroke="#D97706" strokeWidth={2.4} />
      <path d="M 100 166.5 l 1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6 Z" fill="#FDE68A" />
    </g>
  );
}

// ————————————————————————————— back slot —————————————————————————————

function Cape(_: AccProps) {
  return (
    <g>
      <path d="M 66 96 Q 40 140 50 172 Q 76 164 96 170 L 96 100 Z" fill="#F87171" stroke="#C24343" strokeWidth={2.6} strokeLinejoin="round" transform="rotate(3 80 130)" />
      <path d="M 134 96 Q 160 140 150 172 Q 124 164 104 170 L 104 100 Z" fill="#F87171" stroke="#C24343" strokeWidth={2.6} strokeLinejoin="round" transform="rotate(-3 120 130)" />
    </g>
  );
}

function FairyWings(_: AccProps) {
  return (
    <g opacity={0.9}>
      <path d="M 62 100 Q 20 74 26 116 Q 30 140 62 132 Z" fill="#E9E4FE" stroke="#8B78D0" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 138 100 Q 180 74 174 116 Q 170 140 138 132 Z" fill="#E9E4FE" stroke="#8B78D0" strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={40} cy={104} r={4} fill="#C4B5FD" opacity={0.7} />
      <circle cx={160} cy={104} r={4} fill="#C4B5FD" opacity={0.7} />
    </g>
  );
}

// ————————————————————————————— registry —————————————————————————————

const ACCESSORY_VISUALS: Record<string, { zone: AccessorySlot; C: (p: AccProps) => React.ReactElement }> = {
  acc_hat: { zone: 'head', C: Cap },
  acc_bow: { zone: 'head', C: Bow },
  acc_crown: { zone: 'head', C: Crown },
  acc_flower: { zone: 'head', C: FlowerClip },
  acc_wizard: { zone: 'head', C: WizardHat },
  acc_glasses: { zone: 'face', C: Glasses },
  acc_sunglasses: { zone: 'face', C: SunglassesAcc },
  acc_scarf: { zone: 'neck', C: Scarf },
  acc_medal: { zone: 'neck', C: Medal },
  acc_cape: { zone: 'back', C: Cape },
  acc_wings: { zone: 'back', C: FairyWings },
};

export function AccessoryLayer({ id, zone, p }: { id: string; zone: AccessorySlot; p: SpeciesPalette }) {
  const def = ACCESSORY_VISUALS[id];
  if (!def || def.zone !== zone) return null;
  return <def.C p={p} />;
}

// ——————————————————————— evolution signature props ———————————————————————

function Sweatband(_: AccProps) {
  return (
    <g>
      <path d="M 72 68 Q 100 54 128 68 L 128 78 Q 100 64 72 78 Z" fill="#F87171" stroke="#C24343" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 78 71 Q 100 59 122 71" stroke="#FECACA" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </g>
  );
}

function GradCap(_: AccProps) {
  return (
    <g>
      <path d="M 82 62 Q 100 68 118 62 L 118 54 Q 100 60 82 54 Z" fill="#475569" stroke="#334155" strokeWidth={2} />
      <path d="M 60 50 L 100 36 L 140 50 L 100 64 Z" fill="#64748B" stroke="#334155" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M 138 52 L 140 74" stroke="#FBBF24" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={140} cy={78} r={4} fill="#FBBF24" />
    </g>
  );
}

function Beret(_: AccProps) {
  return (
    <g transform="rotate(-8 100 56)">
      <path d="M 70 64 Q 68 42 100 40 Q 132 42 130 64 Q 100 74 70 64 Z" fill="#C4B5FD" stroke="#8B78D0" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 98 40 Q 100 34 104 33" stroke="#8B78D0" strokeWidth={3} strokeLinecap="round" fill="none" />
    </g>
  );
}

function FlowerCrown(_: AccProps) {
  const flower = (cx: number, cy: number, fill: string) => (
    <g key={`${cx}${cy}`}>
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx={cx} cy={cy - 4.5} rx={2.8} ry={4.2} fill={fill} transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={2.6} fill="#FBBF24" />
    </g>
  );
  return (
    <g>
      <path d="M 74 66 Q 100 52 126 66" stroke="#4E9B62" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      {flower(80, 63, '#F9A8D4')}
      {flower(100, 55, '#FDA4AF')}
      {flower(120, 63, '#C4B5FD')}
    </g>
  );
}

function JesterHat(_: AccProps) {
  return (
    <g>
      <path d="M 74 66 Q 78 44 62 34 Q 84 38 92 52 Q 96 32 100 24 Q 104 32 108 52 Q 116 38 138 34 Q 122 44 126 66 Q 100 76 74 66 Z"
        fill="#F472B6" stroke="#C2508D" strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M 92 52 Q 96 32 100 24 Q 104 32 108 52 Q 100 56 92 52 Z" fill="#86EFAC" stroke="#3FA968" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={62} cy={34} r={4.2} fill="#FBBF24" stroke="#D97706" strokeWidth={1.8} />
      <circle cx={100} cy={24} r={4.2} fill="#FBBF24" stroke="#D97706" strokeWidth={1.8} />
      <circle cx={138} cy={34} r={4.2} fill="#FBBF24" stroke="#D97706" strokeWidth={1.8} />
    </g>
  );
}

const EVOLUTION_PROPS: Record<EvolutionPath, (p: AccProps) => React.ReactElement> = {
  athletic: Sweatband,
  scholar: GradCap,
  artist: Beret,
  healer: FlowerCrown,
  trickster: JesterHat,
};

/** Signature prop appears from adult stage, only when no head accessory is worn. */
export function EvolutionProp({ path, stage, p }: { path: EvolutionPath | null; stage: PetStage; p: SpeciesPalette }) {
  if (!path || (stage !== 'adult' && stage !== 'legendary')) return null;
  const C = EVOLUTION_PROPS[path];
  return <C p={p} />;
}
