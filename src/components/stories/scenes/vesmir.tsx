// Vesmír — startovací plocha, hlubší vesmír a přistání na duhové planetě.
// Structure mirrors kouzla.tsx (the reference scene): namespaced animations,
// three variant layers, calm bottom-centre zone (x 120–240, y 150–200).
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-vesmir { display: block; width: 100%; height: 100%; }
.bubsc-vesmir .bubsc-vesmir-star { transform-box: fill-box; transform-origin: center; animation: bubsc-vesmir-twinkle 2.8s ease-in-out infinite; }
.bubsc-vesmir .bubsc-vesmir-glow { animation: bubsc-vesmir-pulse 3.4s ease-in-out infinite; }
.bubsc-vesmir .bubsc-vesmir-flash { animation: bubsc-vesmir-flash 2.4s ease-in-out infinite; }
.bubsc-vesmir .bubsc-vesmir-float { animation: bubsc-vesmir-float 5.4s ease-in-out infinite alternate; }
.bubsc-vesmir .bubsc-vesmir-comet { animation: bubsc-vesmir-slide 11s ease-in-out infinite alternate; }
.bubsc-vesmir .bubsc-vesmir-cloud { animation: bubsc-vesmir-drift 18s ease-in-out infinite alternate; }
@keyframes bubsc-vesmir-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes bubsc-vesmir-pulse { 0%,100% { opacity: 0.28; } 50% { opacity: 0.7; } }
@keyframes bubsc-vesmir-flash { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
@keyframes bubsc-vesmir-float { from { transform: translateY(0); } to { transform: translateY(-6px); } }
@keyframes bubsc-vesmir-slide { from { transform: translate(0, 0); } to { transform: translate(-16px, 8px); } }
@keyframes bubsc-vesmir-drift { from { transform: translateX(0); } to { transform: translateX(14px); } }
@media (prefers-reduced-motion: reduce) { .bubsc-vesmir * { animation: none !important; } }
`;

const rd = (n: number): number => Math.round(n * 10) / 10;

function Spark({ cx, cy, r, fill = '#FFF3C4', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-vesmir-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

function Dust({ points }: { points: { x: number; y: number; r: number; o: number }[] }) {
  return (
    <g fill="#FFFFFF">
      {points.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={p.r} opacity={p.o} />
      ))}
    </g>
  );
}

/** Bubble-shine rocket — the same craft lands again in the finale. */
function Rocket({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -13 6 Q 0 -30 13 6 Z" fill="#F9A8D4" />
      <rect x={-13} y={0} width={26} height={44} rx={11} fill="#FFFFFF" stroke="#DCCEF9" strokeWidth={2} />
      <rect x={-13} y={32} width={26} height={6} fill="#FDA4AF" />
      <circle cx={0} cy={14} r={7.5} fill="#C4B5FD" stroke="#9F8AE0" strokeWidth={2} />
      <path d="M -4.6 11 Q -6.4 14.6 -4 17.6" stroke="#FFFFFF" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d="M -13 22 Q -25 30 -23 42 L -13 42 Z" fill="#86EFAC" />
      <path d="M 13 22 Q 25 30 23 42 L 13 42 Z" fill="#86EFAC" />
      <path d="M -15 38 L 15 38 L 19 44 L -19 44 Z" fill="#C4B5FD" />
    </g>
  );
}

/** 0 — setkání: launch pad on the hill, the sky still light, the moon watching. */
function Setkani() {
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-vesmir-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B7CCF6" />
          <stop offset="52%" stopColor="#DBD6F7" />
          <stop offset="100%" stopColor="#FBDCE7" />
        </linearGradient>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-vesmir-dawn)" />
      {/* moon */}
      <circle cx={302} cy={44} r={30} fill="#FFF6D6" opacity={0.28} className="bubsc-vesmir-glow" />
      <circle cx={302} cy={44} r={20} fill="#FFF6D6" />
      <g fill="#F0E3BC" opacity={0.85}>
        <circle cx={295} cy={38} r={4.4} />
        <circle cx={309} cy={50} r={3.4} />
        <circle cx={298} cy={53} r={2.4} />
      </g>
      <Dust
        points={[
          { x: 40, y: 20, r: 1.6, o: 0.8 },
          { x: 118, y: 34, r: 1.3, o: 0.7 },
          { x: 202, y: 18, r: 1.5, o: 0.75 },
          { x: 246, y: 62, r: 1.2, o: 0.6 },
          { x: 336, y: 88, r: 1.4, o: 0.65 },
          { x: 158, y: 66, r: 1.2, o: 0.6 },
          { x: 268, y: 96, r: 1.3, o: 0.6 },
          { x: 84, y: 12, r: 1.3, o: 0.7 },
          { x: 288, y: 14, r: 1.2, o: 0.6 },
          { x: 224, y: 84, r: 1.2, o: 0.5 },
        ]}
      />
      <Spark cx={168} cy={30} r={4.4} delay={0.3} />
      <Spark cx={236} cy={26} r={3.6} fill="#FFFFFF" delay={1.4} />
      <Spark cx={96} cy={54} r={4} fill="#FDE68A" delay={2.1} />
      <Spark cx={274} cy={72} r={3.6} fill="#FFFFFF" delay={0.9} />
      <Spark cx={148} cy={96} r={3.4} fill="#FDE68A" delay={1.8} />
      <Spark cx={344} cy={112} r={4} delay={2.6} />
      <g className="bubsc-vesmir-cloud" opacity={0.7}>
        <ellipse cx={214} cy={100} rx={30} ry={11} fill="#FFFFFF" />
        <ellipse cx={234} cy={94} rx={20} ry={9} fill="#FFFFFF" />
        <ellipse cx={196} cy={95} rx={16} ry={8} fill="#FFFFFF" />
      </g>
      {/* rolling ground */}
      <path d="M 118 152 Q 170 116 216 144 Q 258 168 318 134 Q 342 122 360 134 L 360 156 L 118 156 Z" fill="#CBE9DA" />
      <path d="M 0 152 Q 92 132 190 150 Q 280 164 360 146 L 360 200 L 0 200 Z" fill="#B7E8CB" />
      {/* little grove on the far side */}
      {[
        { cx: 262, cy: 148, r: 11 },
        { cx: 286, cy: 143, r: 14 },
        { cx: 310, cy: 149, r: 10 },
      ].map((t) => (
        <g key={t.cx}>
          <rect x={t.cx - 2.4} y={t.cy} width={4.8} height={14} rx={2.4} fill="#7FC79C" />
          <circle cx={t.cx} cy={t.cy} r={t.r} fill="#8FDCAE" />
          <circle cx={t.cx - t.r * 0.3} cy={t.cy - t.r * 0.34} r={t.r * 0.42} fill="#A7E8C0" />
        </g>
      ))}
      <path d="M 4 200 Q 16 150 66 143 Q 116 150 128 200 Z" fill="#8FDCAE" />
      <path d="M 190 200 Q 250 176 360 182 L 360 200 Z" fill="#A2E2BC" />
      {/* trail up to the pad */}
      <path d="M 26 200 Q 44 178 38 160" stroke="#C9EFDA" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.85} />
      {/* launch pad */}
      <rect x={38} y={143} width={58} height={8} rx={4} fill="#CDBEE9" />
      <path d="M 48 151 L 43 164 M 86 151 L 91 164" stroke="#B7A5DE" strokeWidth={3} strokeLinecap="round" />
      <Rocket x={66} y={99} s={1} />
      {/* service tower */}
      <rect x={92} y={80} width={6} height={64} rx={3} fill="#C4B5FD" />
      <path d="M 92 94 L 98 106 M 98 94 L 92 106 M 92 112 L 98 124 M 98 112 L 92 124" stroke="#B7A5DE" strokeWidth={2} strokeLinecap="round" />
      <rect x={82} y={110} width={12} height={5} rx={2.5} fill="#C4B5FD" />
      <circle cx={95} cy={76} r={3.4} fill="#FDA4AF" />
      <circle cx={95} cy={76} r={7} fill="#FDA4AF" opacity={0.35} className="bubsc-vesmir-glow" />
    </g>
  );
}

/** 1 — hloubka: ringed worlds, a drifting asteroid belt, a comet, pastel nebulae. */
function Hloubka() {
  const belt: { cx: number; cy: number; r: number; fill: string; delay: number }[] = [
    { cx: 18, cy: 136, r: 7, fill: '#B5A6DC', delay: 0 },
    { cx: 52, cy: 131, r: 5, fill: '#C2B4E4', delay: 0.6 },
    { cx: 86, cy: 138, r: 8, fill: '#A493D2', delay: 1.3 },
    { cx: 118, cy: 127, r: 5.5, fill: '#B5A6DC', delay: 2 },
    { cx: 150, cy: 134, r: 6.5, fill: '#C2B4E4', delay: 0.9 },
    { cx: 182, cy: 125, r: 4.5, fill: '#A493D2', delay: 1.7 },
    { cx: 214, cy: 132, r: 7.5, fill: '#B5A6DC', delay: 0.3 },
    { cx: 246, cy: 121, r: 5, fill: '#C2B4E4', delay: 2.3 },
    { cx: 278, cy: 130, r: 6, fill: '#A493D2', delay: 1.1 },
    { cx: 310, cy: 118, r: 8, fill: '#B5A6DC', delay: 1.9 },
    { cx: 342, cy: 126, r: 5.5, fill: '#C2B4E4', delay: 0.5 },
  ];
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-vesmir-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F4489" />
          <stop offset="100%" stopColor="#8574C4" />
        </linearGradient>
        <radialGradient id="bubsc-vesmir-neb-a">
          <stop offset="0%" stopColor="#F9A8D4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F9A8D4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bubsc-vesmir-neb-b">
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#86EFAC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bubsc-vesmir-neb-c">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
        </radialGradient>
        <clipPath id="bubsc-vesmir-ringed">
          <circle cx={76} cy={72} r={30} />
        </clipPath>
        <clipPath id="bubsc-vesmir-mint">
          <circle cx={296} cy={56} r={20} />
        </clipPath>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-vesmir-deep)" />
      {/* nebulae */}
      <ellipse cx={96} cy={144} rx={148} ry={76} fill="url(#bubsc-vesmir-neb-a)" />
      <ellipse cx={286} cy={86} rx={112} ry={68} fill="url(#bubsc-vesmir-neb-b)" />
      <ellipse cx={186} cy={44} rx={134} ry={56} fill="url(#bubsc-vesmir-neb-c)" />
      <Dust
        points={[
          { x: 26, y: 24, r: 1.5, o: 0.85 },
          { x: 62, y: 16, r: 1.2, o: 0.7 },
          { x: 108, y: 34, r: 1.4, o: 0.8 },
          { x: 142, y: 12, r: 1.2, o: 0.65 },
          { x: 196, y: 74, r: 1.3, o: 0.7 },
          { x: 226, y: 96, r: 1.5, o: 0.8 },
          { x: 262, y: 26, r: 1.2, o: 0.6 },
          { x: 330, y: 100, r: 1.4, o: 0.75 },
          { x: 348, y: 44, r: 1.2, o: 0.6 },
          { x: 12, y: 96, r: 1.3, o: 0.7 },
          { x: 168, y: 108, r: 1.2, o: 0.6 },
          { x: 302, y: 148, r: 1.4, o: 0.55 },
        ]}
      />
      {/* ringed planet — ring behind, planet, ring in front */}
      <g transform="rotate(-18 76 72)">
        <path d="M 26 72 Q 76 42 126 72" fill="none" stroke="#FBBF24" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      </g>
      <circle cx={76} cy={72} r={30} fill="#F9A8D4" />
      <g clipPath="url(#bubsc-vesmir-ringed)">
        <path d="M 42 58 Q 76 66 112 56 L 112 64 Q 76 74 42 66 Z" fill="#E27BAE" opacity={0.55} />
        <path d="M 42 84 Q 76 92 112 82 L 112 88 Q 76 98 42 90 Z" fill="#E27BAE" opacity={0.4} />
        <circle cx={62} cy={58} r={16} fill="#FFFFFF" opacity={0.18} />
      </g>
      <g transform="rotate(-18 76 72)">
        <path d="M 26 72 Q 76 102 126 72" fill="none" stroke="#FBBF24" strokeWidth={5} strokeLinecap="round" />
        <path d="M 26 72 Q 76 102 126 72" fill="none" stroke="#FDE68A" strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
      </g>
      {/* mint world with its little moon */}
      <circle cx={296} cy={56} r={20} fill="#86EFAC" />
      <g clipPath="url(#bubsc-vesmir-mint)" fill="#5CCB8B">
        <circle cx={288} cy={48} r={6} />
        <circle cx={304} cy={64} r={4.4} />
        <circle cx={302} cy={44} r={3} />
      </g>
      <circle cx={288} cy={48} r={16} fill="#FFFFFF" opacity={0.14} />
      <circle cx={328} cy={30} r={6} fill="#FDE68A" />
      {/* small lavender world */}
      <circle cx={150} cy={98} r={11} fill="#C4B5FD" />
      <path d="M 150 87 A 11 11 0 0 1 150 109 A 8 8 0 0 0 150 87 Z" fill="#A78BEA" opacity={0.6} />
      {/* asteroid belt */}
      {belt.map((a) => (
        <g key={`${a.cx}-${a.cy}`} className="bubsc-vesmir-float" style={{ animationDelay: `${a.delay}s` }}>
          <circle cx={a.cx} cy={a.cy} r={a.r} fill={a.fill} />
          <circle cx={a.cx - a.r * 0.3} cy={a.cy - a.r * 0.32} r={a.r * 0.3} fill="#FFFFFF" opacity={0.28} />
          <circle cx={a.cx + a.r * 0.36} cy={a.cy + a.r * 0.24} r={a.r * 0.24} fill="#8E7CC6" opacity={0.5} />
        </g>
      ))}
      {/* comet */}
      <g className="bubsc-vesmir-comet">
        <path d="M 152 46 Q 200 26 246 6 Q 198 20 148 34 Z" fill="#FDE68A" opacity={0.26} />
        <path d="M 151 43 Q 192 26 228 13 Q 190 22 149 37 Z" fill="#FFF3C4" opacity={0.55} />
        <circle cx={150} cy={40} r={10} fill="#FDE68A" opacity={0.35} className="bubsc-vesmir-glow" />
        <circle cx={150} cy={40} r={5.4} fill="#FFF6D6" />
        <circle cx={182} cy={28} r={1.6} fill="#FFF6D6" opacity={0.8} />
        <circle cx={210} cy={17} r={1.3} fill="#FFF6D6" opacity={0.6} />
      </g>
      <Spark cx={44} cy={30} r={5} delay={0.2} />
      <Spark cx={244} cy={62} r={4.4} fill="#F9A8D4" delay={1.5} />
      <Spark cx={202} cy={20} r={4} fill="#C4B5FD" delay={2.2} />
      <Spark cx={340} cy={132} r={4.4} fill="#FDE68A" delay={0.9} />
      <Spark cx={16} cy={62} r={3.6} fill="#86EFAC" delay={1.8} />
    </g>
  );
}

function Burst({ cx, cy, r, fill, delay }: { cx: number; cy: number; r: number; fill: string; delay: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 16;
    return {
      x1: rd(cx + Math.cos(a) * r * 0.34),
      y1: rd(cy + Math.sin(a) * r * 0.34),
      x2: rd(cx + Math.cos(a) * r),
      y2: rd(cy + Math.sin(a) * r),
    };
  });
  return (
    <g className="bubsc-vesmir-flash" style={{ animationDelay: `${delay}s` }}>
      {rays.map((p) => (
        <g key={`${p.x2}-${p.y2}`}>
          <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={fill} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
          <circle cx={p.x2} cy={p.y2} r={1.8} fill={fill} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={2.8} fill={fill} />
    </g>
  );
}

/** 2 — finále: touchdown on the rainbow planet, the ring ablaze, star fireworks. */
function Finale() {
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-vesmir-arrival" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B4E9B" />
          <stop offset="100%" stopColor="#B394D8" />
        </linearGradient>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-vesmir-arrival)" />
      <Dust
        points={[
          { x: 30, y: 22, r: 1.5, o: 0.85 },
          { x: 86, y: 12, r: 1.2, o: 0.7 },
          { x: 140, y: 46, r: 1.3, o: 0.7 },
          { x: 214, y: 60, r: 1.2, o: 0.65 },
          { x: 268, y: 20, r: 1.5, o: 0.8 },
          { x: 330, y: 44, r: 1.3, o: 0.7 },
          { x: 190, y: 104, r: 1.2, o: 0.55 },
          { x: 62, y: 108, r: 1.3, o: 0.6 },
        ]}
      />
      {/* the great ring, arcing behind the planet */}
      <path d="M -40 210 Q 180 -100 400 210" stroke="#FBBF24" strokeWidth={21} fill="none" opacity={0.22} className="bubsc-vesmir-glow" />
      <path d="M -40 210 Q 180 -100 400 210" stroke="#FDE68A" strokeWidth={7} fill="none" opacity={0.9} />
      <path d="M -40 210 Q 180 -100 400 210" stroke="#FFFFFF" strokeWidth={2.4} fill="none" opacity={0.5} />
      {/* fireworks */}
      <Burst cx={104} cy={42} r={17} fill="#F9A8D4" delay={0} />
      <Burst cx={244} cy={30} r={14} fill="#86EFAC" delay={0.8} />
      <Burst cx={310} cy={78} r={16} fill="#FDE68A" delay={1.6} />
      <Burst cx={166} cy={16} r={12} fill="#C4B5FD" delay={1.2} />
      <Burst cx={44} cy={92} r={13} fill="#FDA4AF" delay={2} />
      {/* the rainbow planet */}
      <g>
        <circle cx={180} cy={658} r={520} fill="#FDA4AF" />
        <circle cx={180} cy={658} r={510} fill="#FBBF24" />
        <circle cx={180} cy={658} r={500} fill="#FDE68A" />
        <circle cx={180} cy={658} r={490} fill="#86EFAC" />
        <circle cx={180} cy={658} r={480} fill="#C4B5FD" />
        <circle cx={180} cy={658} r={468} fill="#F9A8D4" />
      </g>
      <path d="M 0 168 Q 180 130 360 168" stroke="#FFFFFF" strokeWidth={2} fill="none" opacity={0.25} />
      {/* the rocket has landed */}
      <ellipse cx={69} cy={172} rx={32} ry={5} fill="#C4859A" opacity={0.25} />
      <path d="M 60 150 L 47 166 M 78 150 L 91 166" stroke="#C4B5FD" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={45} cy={167} rx={5.5} ry={2.6} fill="#C4B5FD" />
      <ellipse cx={93} cy={167} rx={5.5} ry={2.6} fill="#C4B5FD" />
      <Rocket x={69} y={106} s={1} />
      {/* the flag with a bubble */}
      <ellipse cx={292} cy={168} rx={13} ry={3.6} fill="#F6C7D9" opacity={0.7} />
      <path d="M 292 168 L 292 100" stroke="#EDE4FB" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 292 102 Q 312 96 332 104 L 332 124 Q 312 130 292 122 Z" fill="#F9A8D4" />
      <circle cx={312} cy={113} r={7} fill="#C4B5FD" />
      <path d="M 308.4 110 Q 309.8 107 313 107.4" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Spark cx={272} cy={86} r={5} fill="#FDE68A" delay={0.4} />
      <Spark cx={126} cy={70} r={4.4} fill="#FFFFFF" delay={1.3} />
      <Spark cx={206} cy={82} r={4} fill="#F9A8D4" delay={2.1} />
    </g>
  );
}

export function VesmirScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-vesmir" role="presentation">
      <style>{CSS}</style>
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
