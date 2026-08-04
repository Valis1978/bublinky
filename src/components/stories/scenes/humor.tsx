// Legrace — bláznivá louka, cirkusové městečko a konfetová oslava.
// Structure mirrors kouzla.tsx (the reference scene): namespaced animations,
// three variant layers, calm bottom-centre zone (x 120–240, y 150–200).
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-humor { display: block; width: 100%; height: 100%; }
.bubsc-humor .bubsc-humor-star { transform-box: fill-box; transform-origin: center; animation: bubsc-humor-twinkle 2.6s ease-in-out infinite; }
.bubsc-humor .bubsc-humor-float { animation: bubsc-humor-float 4.6s ease-in-out infinite alternate; }
.bubsc-humor .bubsc-humor-rise { animation: bubsc-humor-rise 6.4s ease-in-out infinite alternate; }
.bubsc-humor .bubsc-humor-bob { animation: bubsc-humor-bob 5.6s ease-in-out infinite alternate; }
.bubsc-humor .bubsc-humor-spin { transform-box: fill-box; transform-origin: center; animation: bubsc-humor-spin 34s linear infinite; }
.bubsc-humor .bubsc-humor-sway { transform-box: fill-box; transform-origin: center bottom; animation: bubsc-humor-sway 4.4s ease-in-out infinite alternate; }
.bubsc-humor .bubsc-humor-glow { animation: bubsc-humor-pulse 2.8s ease-in-out infinite; }
.bubsc-humor .bubsc-humor-confetti { transform-box: fill-box; transform-origin: center; animation: bubsc-humor-flutter 3.6s ease-in-out infinite alternate; }
@keyframes bubsc-humor-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.55; } 50% { transform: scale(1.12); opacity: 1; } }
@keyframes bubsc-humor-float { from { transform: translateY(0); } to { transform: translateY(-8px); } }
@keyframes bubsc-humor-rise { from { transform: translateY(5px); } to { transform: translateY(-11px); } }
@keyframes bubsc-humor-bob { from { transform: translateY(-3px); } to { transform: translateY(4px); } }
@keyframes bubsc-humor-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes bubsc-humor-sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
@keyframes bubsc-humor-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.85; } }
@keyframes bubsc-humor-flutter { from { transform: translateY(-4px) rotate(-10deg); } to { transform: translateY(5px) rotate(12deg); } }
@media (prefers-reduced-motion: reduce) { .bubsc-humor * { animation: none !important; } }
`;

const rd = (n: number): number => Math.round(n * 10) / 10;

function Spark({ cx, cy, r, fill = '#FBBF24', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-humor-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

/** Five-petal meadow flower. */
function Flower({ cx, cy, r, petal, heart = '#FBBF24' }: { cx: number; cy: number; r: number; petal: string; heart?: string }) {
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return <circle key={i} cx={rd(cx + Math.cos(a) * r)} cy={rd(cy + Math.sin(a) * r)} r={rd(r * 0.62)} fill={petal} />;
      })}
      <circle cx={cx} cy={cy} r={rd(r * 0.5)} fill={heart} />
    </g>
  );
}

/** Soap bubble — the brand's signature shape, shine included. */
function Bubble({ cx, cy, r, delay, tint = '#FFFFFF' }: { cx: number; cy: number; r: number; delay: number; tint?: string }) {
  return (
    <g className="bubsc-humor-rise" style={{ animationDelay: `${delay}s` }}>
      <circle cx={cx} cy={cy} r={r} fill={tint} opacity={0.3} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.85} />
      <path
        d={`M ${rd(cx - r * 0.45)} ${rd(cy - r * 0.44)} Q ${rd(cx - r * 0.68)} ${cy} ${rd(cx - r * 0.38)} ${rd(cy + r * 0.36)}`}
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.9}
      />
    </g>
  );
}

function Balloon({ cx, cy, r, fill, delay }: { cx: number; cy: number; r: number; fill: string; delay: number }) {
  const knot = rd(cy + r * 1.2);
  return (
    <g className="bubsc-humor-float" style={{ animationDelay: `${delay}s` }}>
      <path
        d={`M ${cx} ${knot} Q ${rd(cx - r)} ${rd(cy + r * 0.6)} ${rd(cx - r)} ${cy} Q ${rd(cx - r)} ${rd(cy - r * 1.18)} ${cx} ${rd(cy - r * 1.18)} Q ${rd(cx + r)} ${rd(cy - r * 1.18)} ${rd(cx + r)} ${cy} Q ${rd(cx + r)} ${rd(cy + r * 0.6)} ${cx} ${knot} Z`}
        fill={fill}
      />
      <path d={`M ${cx - 3.4} ${knot} L ${cx + 3.4} ${knot} L ${cx} ${rd(knot + 5)} Z`} fill={fill} />
      <path d={`M ${cx} ${rd(knot + 5)} q 6 11 -3 20 q -8 9 2 17`} stroke={fill} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7} />
      <path
        d={`M ${rd(cx - r * 0.46)} ${rd(cy - r * 0.5)} Q ${rd(cx - r * 0.64)} ${rd(cy - r * 0.04)} ${rd(cx - r * 0.4)} ${rd(cy + r * 0.32)}`}
        stroke="#FFFFFF"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
    </g>
  );
}

/** A tree planted the wrong way up — roots in the sky, blossoming anyway. */
function UpsideTree({ cx, groundY, h, bark, leaf, petals }: { cx: number; groundY: number; h: number; bark: string; leaf: string; petals: string[] }) {
  const topY = groundY - h;
  return (
    <g>
      <path
        d={`M ${cx - 30} ${groundY + 10} Q ${cx - 32} ${groundY - 10} ${cx - 16} ${groundY - 13} Q ${cx - 10} ${groundY - 24} ${cx + 2} ${groundY - 19} Q ${cx + 18} ${groundY - 23} ${cx + 20} ${groundY - 10} Q ${cx + 32} ${groundY - 6} ${cx + 30} ${groundY + 10} Z`}
        fill={leaf}
      />
      <path d={`M ${cx - 14} ${groundY - 16} Q ${cx - 6} ${groundY - 22} ${cx + 4} ${groundY - 18}`} stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.35} />
      <rect x={cx - 5} y={topY} width={10} height={groundY - 14 - topY} rx={5} fill={bark} />
      <path
        d={`M ${cx} ${topY + 6} Q ${cx - 6} ${topY - 12} ${cx - 20} ${topY - 20} M ${cx} ${topY + 6} Q ${cx + 5} ${topY - 16} ${cx + 18} ${topY - 24} M ${cx} ${topY + 6} Q ${cx - 2} ${topY - 10} ${cx} ${topY - 24}`}
        stroke={bark}
        strokeWidth={4.4}
        fill="none"
        strokeLinecap="round"
      />
      <Flower cx={cx - 21} cy={topY - 22} r={6} petal={petals[0]} />
      <Flower cx={cx + 19} cy={topY - 26} r={6.5} petal={petals[1]} />
      <Flower cx={cx} cy={topY - 27} r={5.5} petal={petals[2]} />
    </g>
  );
}

/** 0 — setkání: a meadow where nothing behaves, and the sun finds it hilarious. */
function Setkani() {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 12;
    return {
      x1: rd(42 + Math.cos(a) * 24),
      y1: rd(36 + Math.sin(a) * 24),
      x2: rd(42 + Math.cos(a) * 33),
      y2: rd(36 + Math.sin(a) * 33),
    };
  });
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-humor-sky0" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3D2" />
          <stop offset="100%" stopColor="#FFF9EA" />
        </linearGradient>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-humor-sky0)" />
      {/* the sun, mid-laugh */}
      <g className="bubsc-humor-spin">
        {rays.map((p) => (
          <line key={`${p.x2}-${p.y2}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="#FBBF24" strokeWidth={4.4} strokeLinecap="round" opacity={0.85} />
        ))}
      </g>
      <circle cx={42} cy={36} r={21} fill="#FDE68A" stroke="#FBBF24" strokeWidth={3} />
      <ellipse cx={28} cy={43} rx={5} ry={3.4} fill="#FDA4AF" opacity={0.75} />
      <ellipse cx={56} cy={43} rx={5} ry={3.4} fill="#FDA4AF" opacity={0.75} />
      <path d="M 31 33 Q 35 27 39 33 M 45 33 Q 49 27 53 33" stroke="#D9822B" strokeWidth={2.8} fill="none" strokeLinecap="round" />
      <path d="M 32 41 Q 42 55 52 41 Z" fill="#EE7F94" />
      <path d="M 37 48 Q 42 54 47 48 Z" fill="#FDA4AF" />
      {/* balloons let loose */}
      <Balloon cx={140} cy={46} r={13} fill="#F9A8D4" delay={0} />
      <Balloon cx={186} cy={30} r={11} fill="#C4B5FD" delay={0.9} />
      <Balloon cx={232} cy={54} r={12} fill="#86EFAC" delay={1.8} />
      <Balloon cx={340} cy={70} r={14} fill="#FDA4AF" delay={0.4} />
      {/* one cloud that clearly knows something */}
      <g className="bubsc-humor-bob">
        <ellipse cx={274} cy={36} rx={29} ry={12} fill="#FFFFFF" opacity={0.94} />
        <ellipse cx={292} cy={29} rx={17} ry={10} fill="#FFFFFF" opacity={0.94} />
        <ellipse cx={256} cy={30} rx={14} ry={8} fill="#FFFFFF" opacity={0.94} />
        <path d="M 260 32 Q 264 28 268 32" stroke="#B79DE8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <circle cx={280} cy={31} r={2.2} fill="#B79DE8" />
        <path d="M 261 39 Q 269 47 278 39" stroke="#B79DE8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </g>
      {/* meadow */}
      <path d="M 0 140 Q 92 124 182 138 Q 272 152 360 134 L 360 200 L 0 200 Z" fill="#A7E8C0" />
      <path d="M 0 162 Q 102 148 202 164 Q 292 176 360 158 L 360 200 L 0 200 Z" fill="#86EFAC" />
      <UpsideTree cx={88} groundY={150} h={58} bark="#C79A5F" leaf="#5FCF8E" petals={['#F9A8D4', '#C4B5FD', '#FDA4AF']} />
      <UpsideTree cx={302} groundY={158} h={50} bark="#C79A5F" leaf="#5FCF8E" petals={['#FDA4AF', '#F9A8D4', '#C4B5FD']} />
      {/* grass and blossoms, kept away from the middle */}
      <path
        d="M 46 176 q -3 -9 -9 -13 M 46 176 q 0 -11 2 -15 M 46 176 q 5 -8 11 -11 M 264 188 q -3 -9 -9 -12 M 264 188 q 0 -10 2 -14 M 264 188 q 5 -8 11 -10"
        stroke="#5FCF8E"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <Flower cx={24} cy={176} r={5.5} petal="#F9A8D4" />
      <Flower cx={94} cy={186} r={5} petal="#C4B5FD" />
      <Flower cx={330} cy={180} r={5.5} petal="#FDA4AF" />
      <Spark cx={172} cy={98} r={4.4} fill="#FBBF24" delay={0.6} />
      <Spark cx={256} cy={22} r={4} fill="#F9A8D4" delay={1.7} />
    </g>
  );
}

/** Striped big top. `uid` keeps the clip paths unique per tent. */
function Tent({ cx, apexY, halfW, roofY, stripe, uid }: { cx: number; apexY: number; halfW: number; roofY: number; stripe: string; uid: string }) {
  const ground = 152;
  const bodyHalf = rd(halfW * 0.76);
  const roofPath = `M ${cx - halfW} ${roofY} Q ${rd(cx - halfW * 0.72)} ${rd(apexY + (roofY - apexY) * 0.3)} ${cx} ${apexY} Q ${rd(cx + halfW * 0.72)} ${rd(apexY + (roofY - apexY) * 0.3)} ${cx + halfW} ${roofY} Q ${cx} ${roofY - 13} ${cx - halfW} ${roofY} Z`;
  const steps = 6;
  const span = (halfW * 2.3) / steps;
  const wedges = Array.from({ length: steps }, (_, i) => ({
    x0: rd(cx - halfW * 1.15 + span * i),
    x1: rd(cx - halfW * 1.15 + span * (i + 1)),
    on: i % 2 === 0,
  }));
  const bars = Array.from({ length: 4 }, (_, i) => rd(cx - bodyHalf + 4 + i * ((bodyHalf * 2 - 8) / 3.4)));
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-roof`}>
          <path d={roofPath} />
        </clipPath>
        <clipPath id={`${uid}-body`}>
          <path d={`M ${cx - bodyHalf} ${ground} L ${cx - bodyHalf} ${roofY - 6} L ${cx + bodyHalf} ${roofY - 6} L ${cx + bodyHalf} ${ground} Z`} />
        </clipPath>
      </defs>
      {/* body */}
      <g clipPath={`url(#${uid}-body)`}>
        <rect x={cx - bodyHalf} y={roofY - 8} width={bodyHalf * 2} height={ground - roofY + 10} fill="#FFFFFF" />
        {bars.map((bx) => (
          <rect key={bx} x={bx} y={roofY - 8} width={8} height={ground - roofY + 10} fill={stripe} opacity={0.85} />
        ))}
      </g>
      {/* roof */}
      <g clipPath={`url(#${uid}-roof)`}>
        <rect x={cx - halfW - 4} y={apexY - 4} width={halfW * 2 + 8} height={roofY - apexY + 20} fill="#FFFFFF" />
        {wedges.map((w) =>
          w.on ? <path key={w.x0} d={`M ${cx} ${apexY - 2} L ${w.x0} ${roofY + 6} L ${w.x1} ${roofY + 6} Z`} fill={stripe} /> : null,
        )}
      </g>
      <path d={roofPath} fill="none" stroke={stripe} strokeWidth={2} opacity={0.55} />
      {/* doorway */}
      <path d={`M ${cx - 14} ${ground} L ${cx - 14} ${ground - 20} Q ${cx} ${ground - 32} ${cx + 14} ${ground - 20} L ${cx + 14} ${ground} Z`} fill="#C4B5FD" />
      <path d={`M ${cx - 15} ${ground} Q ${cx - 21} ${ground - 16} ${cx - 13} ${ground - 24}`} stroke="#FBBF24" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d={`M ${cx + 15} ${ground} Q ${cx + 21} ${ground - 16} ${cx + 13} ${ground - 24}`} stroke="#FBBF24" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* pennant */}
      <path d={`M ${cx} ${apexY} L ${cx} ${apexY - 14}`} stroke="#C4B5FD" strokeWidth={2.6} strokeLinecap="round" />
      <path d={`M ${cx} ${apexY - 14} L ${cx + 16} ${apexY - 9} L ${cx} ${apexY - 4} Z`} fill="#FBBF24" />
    </g>
  );
}

/** Row of little flags on a sagging string. */
function Bunting({ y0, dip, colors }: { y0: number; dip: number; colors: string[] }) {
  const count = 13;
  const pts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return { x: rd(360 * t), y: rd(y0 + 4 * dip * t * (1 - t)) };
  });
  return (
    <g>
      <path d={`M 0 ${y0} Q 180 ${y0 + 2 * dip} 360 ${y0}`} fill="none" stroke="#C4B5FD" strokeWidth={2} strokeLinecap="round" />
      {pts.map((p, i) => (
        <path key={p.x} d={`M ${p.x - 7} ${p.y} L ${p.x + 7} ${p.y} L ${p.x} ${p.y + 15} Z`} fill={colors[i % colors.length]} />
      ))}
    </g>
  );
}

/** 1 — hloubka: circus town after supper — juggling, flags and bubbles. */
function Hloubka() {
  const balls = [
    { cx: 172, cy: 96, fill: '#F9A8D4', delay: 0 },
    { cx: 186, cy: 70, fill: '#86EFAC', delay: 0.5 },
    { cx: 204, cy: 64, fill: '#FBBF24', delay: 1 },
    { cx: 220, cy: 88, fill: '#C4B5FD', delay: 1.5 },
    { cx: 196, cy: 110, fill: '#FDA4AF', delay: 2 },
  ];
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-humor-sky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEDCF8" />
          <stop offset="100%" stopColor="#FBE3F1" />
        </linearGradient>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-humor-sky1)" />
      <Spark cx={40} cy={72} r={4.4} fill="#FBBF24" delay={0.4} />
      <Spark cx={330} cy={58} r={4} fill="#F9A8D4" delay={1.6} />
      <Bunting y0={18} dip={26} colors={['#F9A8D4', '#C4B5FD', '#86EFAC', '#FBBF24', '#FDA4AF']} />
      {/* fairground */}
      <path d="M 0 152 L 360 152 L 360 200 L 0 200 Z" fill="#F0E0EE" />
      <path d="M 0 152 L 360 152 L 360 157 L 0 157 Z" fill="#E2CEE2" />
      <path d="M 16 174 L 92 174 M 268 182 L 344 182" stroke="#E7D5E6" strokeWidth={3} strokeLinecap="round" />
      <Tent cx={86} apexY={50} halfW={66} roofY={124} stripe="#F9A8D4" uid="bubsc-humor-t1" />
      <Tent cx={292} apexY={76} halfW={48} roofY={128} stripe="#86EFAC" uid="bubsc-humor-t2" />
      {/* props left out on the lot */}
      <ellipse cx={36} cy={180} rx={14} ry={3.4} fill="#E2CEE2" />
      <circle cx={36} cy={169} r={11} fill="#FFFFFF" />
      <path d="M 27 175 Q 36 169 45 175 M 27 163 Q 36 169 45 163" stroke="#F9A8D4" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <circle cx={36} cy={169} r={11} fill="none" stroke="#F4C9E0" strokeWidth={1.6} />
      <ellipse cx={328} cy={184} rx={16} ry={3.4} fill="#E2CEE2" />
      <ellipse cx={328} cy={170} rx={15} ry={14} fill="none" stroke="#FBBF24" strokeWidth={4} />
      <ellipse cx={328} cy={170} rx={15} ry={14} fill="none" stroke="#FDE68A" strokeWidth={1.4} />
      {/* juggling, mid-air */}
      <path d="M 168 102 Q 196 50 226 94" stroke="#C4B5FD" strokeWidth={2} strokeDasharray="3 6" fill="none" strokeLinecap="round" opacity={0.45} />
      {balls.map((b) => (
        <g key={`${b.cx}-${b.cy}`} className="bubsc-humor-float" style={{ animationDelay: `${b.delay}s` }}>
          <circle cx={b.cx} cy={b.cy} r={7.5} fill={b.fill} />
          <path d={`M ${b.cx - 3.4} ${b.cy - 3.6} Q ${b.cx - 5.2} ${b.cy} ${b.cx - 2.8} ${b.cy + 3}`} stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      ))}
      {/* bubbles from somewhere behind the tents */}
      <Bubble cx={40} cy={88} r={11} delay={0} tint="#F9A8D4" />
      <Bubble cx={128} cy={60} r={8} delay={1.1} tint="#C4B5FD" />
      <Bubble cx={244} cy={124} r={9} delay={0.6} tint="#86EFAC" />
      <Bubble cx={338} cy={100} r={12} delay={1.8} tint="#FDA4AF" />
      <Bubble cx={158} cy={136} r={6.5} delay={2.4} tint="#FBBF24" />
      <Bubble cx={306} cy={40} r={7.5} delay={1.4} tint="#F9A8D4" />
    </g>
  );
}

const CONFETTI: { x: number; y: number; w: number; h: number; fill: string; rot: number; delay: number }[] = [
  { x: 10, y: 26, w: 10, h: 5, fill: '#F9A8D4', rot: 22, delay: 0 },
  { x: 34, y: 62, w: 8, h: 5, fill: '#86EFAC', rot: -26, delay: 0.8 },
  { x: 14, y: 104, w: 10, h: 5, fill: '#FBBF24', rot: 38, delay: 1.5 },
  { x: 46, y: 20, w: 9, h: 5, fill: '#C4B5FD', rot: -14, delay: 2.2 },
  { x: 88, y: 44, w: 10, h: 5, fill: '#FDA4AF', rot: 30, delay: 0.5 },
  { x: 104, y: 12, w: 8, h: 5, fill: '#F9A8D4', rot: -34, delay: 1.9 },
  { x: 138, y: 152, w: 9, h: 5, fill: '#86EFAC', rot: 18, delay: 1.2 },
  { x: 210, y: 148, w: 8, h: 5, fill: '#C4B5FD', rot: -22, delay: 0.3 },
  { x: 178, y: 6, w: 10, h: 5, fill: '#FBBF24', rot: 26, delay: 2.5 },
  { x: 246, y: 22, w: 9, h: 5, fill: '#FDA4AF', rot: -30, delay: 1 },
  { x: 272, y: 58, w: 10, h: 5, fill: '#F9A8D4', rot: 16, delay: 0.7 },
  { x: 310, y: 30, w: 8, h: 5, fill: '#86EFAC', rot: -18, delay: 1.7 },
  { x: 336, y: 74, w: 10, h: 5, fill: '#C4B5FD', rot: 34, delay: 0.2 },
  { x: 344, y: 122, w: 9, h: 5, fill: '#FBBF24', rot: -24, delay: 2.1 },
  { x: 300, y: 116, w: 8, h: 5, fill: '#FDA4AF', rot: 12, delay: 1.4 },
  { x: 62, y: 132, w: 10, h: 5, fill: '#F9A8D4', rot: -36, delay: 0.9 },
];

/** Party cake with a candle that never quite blows out. */
function Cake({ cx, base, layer, delay }: { cx: number; base: number; layer: string; delay: number }) {
  return (
    <g className="bubsc-humor-sway" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx={cx} cy={base + 4} rx={36} ry={6} fill="#E9DDF7" />
      <rect x={cx - 28} y={base - 22} width={56} height={26} rx={8} fill={layer} />
      <path
        d={`M ${cx - 28} ${base - 20} q 9 -9 18 0 q 9 9 18 0 q 9 -9 18 0 L ${cx + 28} ${base - 12} L ${cx - 28} ${base - 12} Z`}
        fill="#FFFFFF"
        opacity={0.95}
      />
      <rect x={cx - 19} y={base - 42} width={38} height={22} rx={7} fill="#FFF6FB" stroke="#F4C9E0" strokeWidth={1.6} />
      <circle cx={cx - 10} cy={base - 32} r={2} fill="#F9A8D4" />
      <circle cx={cx + 2} cy={base - 36} r={2} fill="#86EFAC" />
      <circle cx={cx + 11} cy={base - 30} r={2} fill="#C4B5FD" />
      <rect x={cx - 2} y={base - 60} width={4} height={18} rx={2} fill="#C4B5FD" />
      <ellipse cx={cx} cy={base - 64} rx={3.6} ry={5.4} fill="#FBBF24" />
      <ellipse cx={cx} cy={base - 64} rx={8} ry={10} fill="#FDE68A" opacity={0.4} className="bubsc-humor-glow" />
    </g>
  );
}

/** 2 — finále: confetti party, cakes, and a grin made of sparks. */
function Finale() {
  const ring = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
    return { x: rd(180 + Math.cos(a) * 52), y: rd(84 + Math.sin(a) * 52), d: rd((i % 5) * 0.5) };
  });
  const smile = Array.from({ length: 7 }, (_, i) => {
    const a = (Math.PI * (30 + i * 20)) / 180;
    return { x: rd(180 + Math.cos(a) * 34), y: rd(82 + Math.sin(a) * 34), d: rd(i * 0.25) };
  });
  return (
    <g>
      <defs>
        <linearGradient id="bubsc-humor-sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0F7" />
          <stop offset="100%" stopColor="#FFF6E8" />
        </linearGradient>
      </defs>
      <rect width={360} height={200} fill="url(#bubsc-humor-sky2)" />
      {/* streamers */}
      <g className="bubsc-humor-sway">
        <path d="M 14 -4 Q 36 20 14 44 Q -6 68 16 92" stroke="#F9A8D4" strokeWidth={4.4} fill="none" strokeLinecap="round" />
      </g>
      <g className="bubsc-humor-sway" style={{ animationDelay: '0.8s' }}>
        <path d="M 60 -4 Q 42 18 62 38 Q 80 58 62 78" stroke="#86EFAC" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      <g className="bubsc-humor-sway" style={{ animationDelay: '1.4s' }}>
        <path d="M 300 -4 Q 320 20 300 42 Q 282 64 302 86" stroke="#C4B5FD" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      <g className="bubsc-humor-sway" style={{ animationDelay: '0.4s' }}>
        <path d="M 346 -4 Q 326 22 348 46 Q 366 68 344 92" stroke="#FBBF24" strokeWidth={4.4} fill="none" strokeLinecap="round" />
      </g>
      {/* the giant grin */}
      <g className="bubsc-humor-bob">
        <circle cx={180} cy={84} r={54} fill="#FDE68A" opacity={0.22} className="bubsc-humor-glow" />
        {ring.map((p) => (
          <Spark key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={4.6} fill="#FBBF24" delay={p.d} />
        ))}
        <path d="M 150 100 Q 180 130 210 100" stroke="#FBBF24" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.28} />
        {smile.map((p) => (
          <Spark key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={3.8} fill="#FDE68A" delay={p.d} />
        ))}
        <circle cx={158} cy={68} r={12} fill="#FDE68A" opacity={0.45} className="bubsc-humor-glow" />
        <circle cx={202} cy={68} r={12} fill="#FDE68A" opacity={0.45} className="bubsc-humor-glow" style={{ animationDelay: '0.6s' }} />
        <Spark cx={158} cy={68} r={9.5} fill="#F59E0B" delay={0.3} />
        <Spark cx={202} cy={68} r={9.5} fill="#F59E0B" delay={0.3} />
      </g>
      {/* the table everything is standing on */}
      <path d="M 0 172 Q 180 164 360 172 L 360 200 L 0 200 Z" fill="#F8E2EE" />
      <Cake cx={58} base={172} layer="#F9A8D4" delay={0} />
      <Cake cx={302} base={176} layer="#C4B5FD" delay={0.9} />
      {/* confetti everywhere */}
      {CONFETTI.map((c) => (
        <g key={`${c.x}-${c.y}`} transform={`rotate(${c.rot} ${rd(c.x + c.w / 2)} ${rd(c.y + c.h / 2)})`}>
          <rect
            className="bubsc-humor-confetti"
            style={{ animationDelay: `${c.delay}s` }}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={c.h / 2}
            fill={c.fill}
          />
        </g>
      ))}
      <circle cx={122} cy={34} r={3.4} fill="#C4B5FD" className="bubsc-humor-confetti" style={{ animationDelay: '1.1s' }} />
      <circle cx={244} cy={98} r={3} fill="#F9A8D4" className="bubsc-humor-confetti" style={{ animationDelay: '0.6s' }} />
      <circle cx={78} cy={94} r={3.2} fill="#86EFAC" className="bubsc-humor-confetti" style={{ animationDelay: '2s' }} />
      <circle cx={328} cy={158} r={3.4} fill="#FBBF24" className="bubsc-humor-confetti" style={{ animationDelay: '1.6s' }} />
      <Bubble cx={110} cy={140} r={9} delay={0.5} tint="#F9A8D4" />
      <Bubble cx={262} cy={132} r={7.5} delay={1.7} tint="#C4B5FD" />
    </g>
  );
}

export function HumorScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-humor" role="presentation">
      <style>{CSS}</style>
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
