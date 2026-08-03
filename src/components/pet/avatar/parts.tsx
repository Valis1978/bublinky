// Shared face + effect layers — identical coordinates for every species.
import type { PetMood } from '@/lib/pet-engine';
import { EYE_DARK, BLUSH, type SpeciesPalette } from './types';

// ————————————————————————————————— eyes —————————————————————————————————
// Eye centers: (78, 104) and (122, 104)

function EyeShine({ cx }: { cx: number }) {
  return (
    <>
      <circle cx={cx + 3.2} cy={100.5} r={2.6} fill="#FFFFFF" />
      <circle cx={cx - 2.6} cy={106.5} r={1.3} fill="#FFFFFF" opacity={0.85} />
    </>
  );
}

function RoundEyes({ r = 7 }: { r?: number }) {
  return (
    <g>
      {[78, 122].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy={104} r={r} fill={EYE_DARK} />
          <EyeShine cx={cx} />
        </g>
      ))}
    </g>
  );
}

/** happy ∩-arc eyes */
function ArcEyes() {
  return (
    <g stroke={EYE_DARK} strokeWidth={3.6} strokeLinecap="round" fill="none">
      <path d="M 71 106 Q 78 97 85 106" />
      <path d="M 115 106 Q 122 97 129 106" />
    </g>
  );
}

function ClosedEyes() {
  return (
    <g stroke={EYE_DARK} strokeWidth={3.4} strokeLinecap="round" fill="none">
      <path d="M 71 104 Q 78 109 85 104" />
      <path d="M 115 104 Q 122 109 129 104" />
    </g>
  );
}

function HalfLidEyes() {
  return (
    <g>
      {[78, 122].map(cx => (
        <g key={cx}>
          <path d={`M ${cx - 7} 104 A 7 7 0 0 0 ${cx + 7} 104 Z`} fill={EYE_DARK} />
          <path
            d={`M ${cx - 7} 104 L ${cx + 7} 104`}
            stroke={EYE_DARK} strokeWidth={2.8} strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

function DroopEyes() {
  return (
    <g>
      {[78, 122].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy={105} r={6} fill={EYE_DARK} />
          <circle cx={cx + 2.4} cy={102.5} r={1.9} fill="#FFFFFF" />
        </g>
      ))}
      {/* worried brows */}
      <g stroke={EYE_DARK} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.75}>
        <path d="M 70 93 Q 78 96 85 94" />
        <path d="M 115 94 Q 122 96 130 93" />
      </g>
    </g>
  );
}

function StarEyes() {
  const star = (cx: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? 8.5 : 3.8;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(104 + rr * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <g>
      <polygon points={star(78)} fill="#FBBF24" stroke="#F59E0B" strokeWidth={1.4} strokeLinejoin="round" />
      <polygon points={star(122)} fill="#FBBF24" stroke="#F59E0B" strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  );
}

function Sunglasses({ p }: { p: SpeciesPalette }) {
  return (
    <g>
      <path d="M 62 100 H 138" stroke={p.dark} strokeWidth={3} strokeLinecap="round" />
      <rect x={64} y={98} width={28} height={16} rx={8} fill={EYE_DARK} stroke={p.dark} strokeWidth={2.4} />
      <rect x={108} y={98} width={28} height={16} rx={8} fill={EYE_DARK} stroke={p.dark} strokeWidth={2.4} />
      <path d="M 68 103 Q 74 100 78 102" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.6} fill="none" />
    </g>
  );
}

// ———————————————————————————————— mouths ————————————————————————————————
// Mouth baseline: y ≈ 126, center x = 100

function SmileMouth() {
  return <path d="M 91 124 Q 100 132 109 124" stroke={EYE_DARK} strokeWidth={3.2} strokeLinecap="round" fill="none" />;
}

function SmallMouth() {
  return <path d="M 95 126 Q 100 129.5 105 126" stroke={EYE_DARK} strokeWidth={3} strokeLinecap="round" fill="none" />;
}

function LaughMouth() {
  return (
    <g>
      <path d="M 88 122 Q 100 138 112 122 Z" fill={EYE_DARK} />
      <path d="M 93 129.5 Q 100 134 107 129.5 L 106 131 Q 100 135.5 94 131 Z" fill="#FCA5C0" />
    </g>
  );
}

function FrownMouth() {
  return <path d="M 92 129 Q 100 122.5 108 129" stroke={EYE_DARK} strokeWidth={3.2} strokeLinecap="round" fill="none" />;
}

function HungryMouth() {
  return (
    <g>
      <ellipse cx={100} cy={127} rx={7.5} ry={5.5} fill={EYE_DARK} />
      {/* drool drop */}
      <path d="M 106.5 129 Q 109 133 106.8 135.6 Q 104.6 133.4 106.5 129 Z" fill="#7DD3FC" />
    </g>
  );
}

function YawnMouth() {
  return <ellipse cx={100} cy={127.5} rx={5} ry={6.5} fill={EYE_DARK} />;
}

function FlatMouth() {
  return <path d="M 93 127 H 107" stroke={EYE_DARK} strokeWidth={3} strokeLinecap="round" />;
}

// ————————————————————————————— composed face ————————————————————————————

export function Blush({ strong = false }: { strong?: boolean }) {
  return (
    <g fill={BLUSH} opacity={strong ? 0.42 : 0.3}>
      <ellipse cx={62} cy={117} rx={7.5} ry={4.4} />
      <ellipse cx={138} cy={117} rx={7.5} ry={4.4} />
    </g>
  );
}

export function Face({ mood, p }: { mood: PetMood; p: SpeciesPalette }) {
  switch (mood) {
    case 'ecstatic':
      return (<g><StarEyes /><LaughMouth /><Blush strong /></g>);
    case 'happy':
      return (<g><ArcEyes /><SmileMouth /><Blush /></g>);
    case 'sad':
      return (<g><DroopEyes /><FrownMouth /><Tear /></g>);
    case 'hungry':
      return (<g><RoundEyes r={7.5} /><HungryMouth /></g>);
    case 'tired':
      return (<g><HalfLidEyes /><YawnMouth /></g>);
    case 'dirty':
      return (<g><RoundEyes r={6.5} /><FlatMouth /><DirtSmudges p={p} /></g>);
    case 'sleeping':
      return (<g><ClosedEyes /><SmallMouth /></g>);
    case 'vacation':
      return (<g><Sunglasses p={p} /><SmileMouth /><Blush /></g>);
    case 'neutral':
    default:
      return (<g><RoundEyes /><SmallMouth /><Blush /></g>);
  }
}

/** Blinking overlay for open-eye moods — eyelids flash via CSS (rig provides keyframes). */
export function BlinkLids({ mood, bodyFill }: { mood: PetMood; bodyFill: string }) {
  const blinks = mood === 'neutral' || mood === 'hungry' || mood === 'dirty' || mood === 'sad';
  if (!blinks) return null;
  return (
    <g className="bub-blink">
      {[78, 122].map(cx => (
        <rect key={cx} x={cx - 9} y={95} width={18} height={19} rx={8} fill={bodyFill} />
      ))}
    </g>
  );
}

// ———————————————————————————————— effects ———————————————————————————————

function Tear() {
  return (
    <g className="bub-tear">
      <path d="M 68 112 Q 65 119 68.5 122.5 Q 72 119 68 112 Z" fill="#7DD3FC" stroke="#38BDF8" strokeWidth={0.8} />
    </g>
  );
}

function DirtSmudges({ p }: { p: SpeciesPalette }) {
  return (
    <g opacity={0.55} fill={p.dark}>
      <ellipse cx={70} cy={132} rx={6} ry={3} transform="rotate(-12 70 132)" />
      <ellipse cx={132} cy={98} rx={5} ry={2.6} transform="rotate(9 132 98)" />
      <ellipse cx={112} cy={148} rx={7} ry={3.2} transform="rotate(-6 112 148)" />
    </g>
  );
}

export function SleepZzz() {
  return (
    <g className="bub-zzz" fill="#A5B4FC" fontFamily="var(--font-nunito), sans-serif" fontWeight={800}>
      <text x={140} y={72} fontSize={17}>z</text>
      <text x={152} y={58} fontSize={13} opacity={0.8}>z</text>
      <text x={161} y={47} fontSize={10} opacity={0.6}>z</text>
    </g>
  );
}

export function StinkSquiggles() {
  return (
    <g stroke="#A3A380" strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} className="bub-stink">
      <path d="M 52 78 q 3 -6 0 -12 q -3 -6 0 -12" />
      <path d="M 148 80 q 3 -6 0 -12 q -3 -6 0 -12" />
    </g>
  );
}

export function JoySparkles() {
  const spark = (cx: number, cy: number, r: number) =>
    `M ${cx} ${cy - r} Q ${cx + r * 0.22} ${cy - r * 0.22} ${cx + r} ${cy} Q ${cx + r * 0.22} ${cy + r * 0.22} ${cx} ${cy + r} Q ${cx - r * 0.22} ${cy + r * 0.22} ${cx - r} ${cy} Q ${cx - r * 0.22} ${cy - r * 0.22} ${cx} ${cy - r} Z`;
  return (
    <g fill="#FBBF24" className="bub-sparkle">
      <path d={spark(46, 70, 7)} />
      <path d={spark(158, 62, 5)} opacity={0.85} />
      <path d={spark(164, 104, 4)} opacity={0.7} />
    </g>
  );
}

/** Soft radial aura for legendary pets. */
export function LegendaryAura({ p }: { p: SpeciesPalette }) {
  return (
    <g className="bub-aura">
      <ellipse cx={100} cy={118} rx={78} ry={70} fill={p.accent} opacity={0.14} />
      <ellipse cx={100} cy={118} rx={66} ry={59} fill={p.accent} opacity={0.12} />
    </g>
  );
}

/** Signature bubble-shine highlight — every Bublík has one. */
export function BubbleShine() {
  return (
    <path
      d="M 62 84 Q 72 70 88 66"
      stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.5}
    />
  );
}
