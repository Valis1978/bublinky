// Zvířátka — sunny garden → forest clearing → animal feast on the meadow.
// Structure, drawing style and animation conventions follow ./kouzla.tsx
// (the reference scene); contract in ./types.ts.
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-zviratka { display: block; width: 100%; height: 100%; }
.bubsc-zviratka .bubsc-zviratka-cloud { animation: bubsc-zviratka-drift 18s ease-in-out infinite alternate; }
.bubsc-zviratka .bubsc-zviratka-fly { animation: bubsc-zviratka-float 3.6s ease-in-out infinite alternate; }
.bubsc-zviratka .bubsc-zviratka-glow { animation: bubsc-zviratka-pulse 3s ease-in-out infinite; }
.bubsc-zviratka .bubsc-zviratka-star { transform-box: fill-box; transform-origin: center; animation: bubsc-zviratka-twinkle 2.6s ease-in-out infinite; }
.bubsc-zviratka .bubsc-zviratka-sway { animation: bubsc-zviratka-fall 6s ease-in-out infinite alternate; }
@keyframes bubsc-zviratka-drift { from { transform: translateX(0); } to { transform: translateX(15px); } }
@keyframes bubsc-zviratka-float { from { transform: translateY(0); } to { transform: translateY(-6px); } }
@keyframes bubsc-zviratka-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.8; } }
@keyframes bubsc-zviratka-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes bubsc-zviratka-fall { from { transform: translateY(-4px); } to { transform: translateY(7px); } }
@media (prefers-reduced-motion: reduce) { .bubsc-zviratka * { animation: none !important; } }
`;

type Pt = [number, number];

/** Point on a quadratic bézier — used to hang garland flags on the rope. */
function qpt(p0: Pt, c: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1]];
}

const FLAG_COLORS = ['#F9A8D4', '#C4B5FD', '#86EFAC', '#FBBF24', '#FDA4AF'];

/** Shared gradients — soft light falloff instead of hard-edged glow discs. */
function Defs() {
  return (
    <defs>
      <radialGradient id="bubsc-zviratka-glow">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#FDE68A" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="bubsc-zviratka-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDF3DC" stopOpacity={0} />
        <stop offset="100%" stopColor="#FDF3DC" stopOpacity={0.8} />
      </linearGradient>
    </defs>
  );
}

/** Soft four-point sparkle — same silhouette as the reference scene. */
function Spark({ cx, cy, r, fill = '#FBBF24', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-zviratka-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

/** Chunky pastel bee; the animated wrapper only translates, the inner g holds the placement. */
function Bee({ x, y, s = 1, delay = 0 }: { x: number; y: number; s?: number; delay?: number }) {
  return (
    <g className="bubsc-zviratka-fly" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx={-3} cy={-8} rx={7} ry={4.4} fill="#FDFCF8" opacity={0.85} transform="rotate(-24 -3 -8)" />
        <ellipse cx={5} cy={-8} rx={6} ry={3.8} fill="#FDFCF8" opacity={0.8} transform="rotate(20 5 -8)" />
        <ellipse cx={0} cy={0} rx={9} ry={7} fill="#FBBF24" stroke="#D9A93C" strokeWidth={1.6} />
        <g stroke="#D9A93C" strokeWidth={2.2} strokeLinecap="round">
          <path d="M -2 -6.4 L -2 6.4" />
          <path d="M 3.2 -5.4 L 3.2 5.4" />
        </g>
        <circle cx={-6} cy={-1.4} r={1.5} fill="#8A6E3C" />
        <path d="M -7 -6 Q -9.5 -10 -12.5 -11" fill="none" stroke="#D9A93C" strokeWidth={1.4} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Five-petal garden flower on a leafy stem. */
function Flower({ x, y, h, petal, center = '#FDE68A' }: { x: number; y: number; h: number; petal: string; center?: string }) {
  return (
    <g>
      <path d={`M ${x} ${y} Q ${x - 3} ${y - h / 2} ${x} ${y - h}`} fill="none" stroke="#6FBF8B" strokeWidth={2.2} strokeLinecap="round" />
      <ellipse cx={x - 5} cy={y - h * 0.55} rx={4.6} ry={2.8} fill="#6FBF8B" transform={`rotate(-24 ${x - 5} ${y - h * 0.55})`} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return <circle key={i} cx={+(x + Math.cos(a) * 4.4).toFixed(2)} cy={+(y - h + Math.sin(a) * 4.4).toFixed(2)} r={3.4} fill={petal} />;
      })}
      <circle cx={x} cy={y - h} r={2.6} fill={center} />
    </g>
  );
}

/** Toadstool with a spotted cap. */
function Mushroom({ x, y, s = 1, cap = '#FDA4AF', edge = '#E98598' }: { x: number; y: number; s?: number; cap?: string; edge?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -4 0 Q -4.6 -8 0 -9 Q 4.6 -8 4 0 Z" fill="#FDF0DC" stroke="#DDBF93" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M -13 -8 Q -11 -22 0 -22 Q 11 -22 13 -8 Q 0 -3.5 -13 -8 Z" fill={cap} stroke={edge} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={-5} cy={-14} r={2.2} fill="#FFF7FA" opacity={0.9} />
      <circle cx={4.5} cy={-16} r={1.8} fill="#FFF7FA" opacity={0.9} />
    </g>
  );
}

/** Curved fern frond built from paired leaflets. */
function Fern({ x, y, s = 1, flip = false, color = '#5FA87C' }: { x: number; y: number; s?: number; flip?: boolean; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M 0 0 Q 14 -14 26 -30" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const t = i / 5;
        const lx = +(t * 26).toFixed(2);
        const ly = +(-t * t * 22 - t * 8).toFixed(2);
        const r = 7 - t * 4;
        return (
          <g key={i}>
            <ellipse cx={lx} cy={+(ly - r * 0.7).toFixed(2)} rx={+(r * 0.55).toFixed(2)} ry={r} fill={color} transform={`rotate(${-26 - i * 6} ${lx} ${ly})`} />
            <ellipse cx={lx} cy={+(ly + r * 0.7).toFixed(2)} rx={+(r * 0.55).toFixed(2)} ry={r} fill={color} transform={`rotate(${26 + i * 6} ${lx} ${ly})`} />
          </g>
        );
      })}
    </g>
  );
}

/** Little paw print pressed into the clearing. */
function Paw({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill="#6FAF80" opacity={0.7}>
      <ellipse cx={0} cy={2.4} rx={4} ry={3.2} />
      <circle cx={-3.4} cy={-2.2} r={1.5} />
      <circle cx={0} cy={-3.6} r={1.6} />
      <circle cx={3.4} cy={-2.2} r={1.5} />
    </g>
  );
}

/** Bunting strung between the trees. */
function Garland({ p0, c, p2, count, shape = 'flag' }: { p0: Pt; c: Pt; p2: Pt; count: number; shape?: 'flag' | 'dot' }) {
  const stops = Array.from({ length: count }, (_, i) => 0.06 + (0.88 * i) / (count - 1));
  return (
    <g>
      <path d={`M ${p0[0]} ${p0[1]} Q ${c[0]} ${c[1]} ${p2[0]} ${p2[1]}`} fill="none" stroke="#C89A6A" strokeWidth={2.2} strokeLinecap="round" />
      {stops.map((t, i) => {
        const [px, py] = qpt(p0, c, p2, t);
        const fill = FLAG_COLORS[i % FLAG_COLORS.length];
        return shape === 'flag' ? (
          <path key={i} d={`M ${(px - 7).toFixed(2)} ${py.toFixed(2)} L ${(px + 7).toFixed(2)} ${py.toFixed(2)} L ${px.toFixed(2)} ${(py + 15).toFixed(2)} Z`} fill={fill} />
        ) : (
          <circle key={i} cx={+px.toFixed(2)} cy={+(py + 6).toFixed(2)} r={4.2} fill={fill} />
        );
      })}
    </g>
  );
}

/** Paper lantern with the brand bubble-shine. */
function Lantern({ x, y, fill, edge, top, delay = 0 }: { x: number; y: number; fill: string; edge: string; top: number; delay?: number }) {
  return (
    <g>
      <path d={`M ${x} ${top} L ${x} ${y - 16}`} stroke="#C89A6A" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x} cy={y} r={30} fill="url(#bubsc-zviratka-glow)" className="bubsc-zviratka-glow" style={{ animationDelay: `${delay}s` }} />
      <rect x={x - 5} y={y - 17} width={10} height={4} rx={2} fill={edge} />
      <ellipse cx={x} cy={y} rx={11} ry={13} fill={fill} stroke={edge} strokeWidth={2} />
      <ellipse cx={x - 3.6} cy={y - 4.5} rx={2.8} ry={4.4} fill="#FFFFFF" opacity={0.45} />
      <rect x={x - 4} y={y + 11} width={8} height={4} rx={2} fill={edge} />
      <path d={`M ${x} ${y + 15} L ${x} ${y + 23}`} stroke={edge} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

/** Drifting feather. */
function Feather({ x, y, rot, fill, edge, s = 1, delay = 0 }: { x: number; y: number; rot: number; fill: string; edge: string; s?: number; delay?: number }) {
  return (
    <g className="bubsc-zviratka-sway" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
        <path d="M 0 -13 Q 7 -3 4 8 Q 0 14 -4 8 Q -7 -3 0 -13 Z" fill={fill} stroke={edge} strokeWidth={1.4} strokeLinejoin="round" />
        <path d="M 0 -10 L 0 16" stroke={edge} strokeWidth={1.3} strokeLinecap="round" opacity={0.85} />
        <g stroke={edge} strokeWidth={1} strokeLinecap="round" opacity={0.5}>
          <path d="M 0 -5 L -4 -1 M 0 -5 L 4 -1" />
          <path d="M 0 1 L -4.4 5 M 0 1 L 4.4 5" />
          <path d="M 0 6 L -2.8 9.4 M 0 6 L 2.8 9.4" />
        </g>
      </g>
    </g>
  );
}

const FENCE_X = [-4, 22, 48, 74, 100, 126, 152, 178, 204, 230, 256, 282, 308, 334];

/** 0 — setkání: sunlit garden, picket fence, bird house, flower bed, a bee. */
function Setkani() {
  return (
    <g>
      <rect width={360} height={200} fill="#E4F3FF" />
      <rect y={66} width={360} height={68} fill="url(#bubsc-zviratka-haze)" />
      {/* morning sun */}
      <circle cx={56} cy={32} r={36} fill="url(#bubsc-zviratka-glow)" className="bubsc-zviratka-glow" />
      <circle cx={56} cy={32} r={18} fill="#FDE68A" />
      <g className="bubsc-zviratka-cloud">
        <ellipse cx={248} cy={32} rx={30} ry={11} fill="#FFFFFF" opacity={0.9} />
        <ellipse cx={270} cy={38} rx={20} ry={8} fill="#FFFFFF" opacity={0.7} />
      </g>
      {/* hedge behind the fence */}
      <path d="M 0 110 Q 40 90 80 108 Q 130 86 180 108 Q 240 88 292 108 Q 330 94 360 110 L 360 200 L 0 200 Z" fill="#BCE7C6" />
      {/* picket fence */}
      <g fill="#FDF6E7" stroke="#DDBF93" strokeWidth={2} strokeLinejoin="round">
        {FENCE_X.map((fx) => (
          <path key={fx} d={`M ${fx} 146 L ${fx} 112 Q ${fx + 7} 102 ${fx + 14} 112 L ${fx + 14} 146 Z`} />
        ))}
      </g>
      <g fill="#F3E3C9" stroke="#DDBF93" strokeWidth={1.6}>
        <rect x={-2} y={118} width={364} height={6} rx={3} />
        <rect x={-2} y={136} width={364} height={6} rx={3} />
      </g>
      {/* lawn */}
      <path d="M 0 146 Q 120 138 230 148 Q 300 154 360 144 L 360 200 L 0 200 Z" fill="#A6E0B6" />
      <path d="M 0 170 Q 140 162 240 172 Q 310 178 360 168 L 360 200 L 0 200 Z" fill="#8ED5A2" opacity={0.9} />
      {/* bird house on a post */}
      <g>
        <rect x={294} y={92} width={9} height={78} rx={4.5} fill="#CBA37A" stroke="#A9805A" strokeWidth={1.8} />
        <rect x={280} y={64} width={38} height={34} rx={6} fill="#FDF0DC" stroke="#D9A88B" strokeWidth={2.2} />
        <path d="M 272 66 Q 299 40 326 66 Z" fill="#FDA4AF" stroke="#E98598" strokeWidth={2.2} strokeLinejoin="round" />
        <circle cx={299} cy={80} r={6.5} fill="#B98C6B" />
        <rect x={296} y={90} width={6} height={4} rx={2} fill="#D9A88B" />
        {/* tenant */}
        <g>
          <ellipse cx={330} cy={58} rx={8} ry={7} fill="#C4B5FD" />
          <circle cx={335} cy={53} r={5} fill="#C4B5FD" />
          <path d="M 339 52 L 344 54 L 339 56 Z" fill="#FBBF24" />
          <circle cx={336.5} cy={52} r={1.4} fill="#5E5079" />
          <path d="M 326 58 Q 320 62 316 58" fill="none" stroke="#9F8AD9" strokeWidth={2} strokeLinecap="round" />
        </g>
      </g>
      {/* flower bed */}
      <g>
        <ellipse cx={58} cy={184} rx={56} ry={15} fill="#D8B79A" />
        <ellipse cx={58} cy={182} rx={44} ry={10} fill="#C79E7E" opacity={0.5} />
        <Flower x={22} y={182} h={28} petal="#F9A8D4" />
        <Flower x={48} y={186} h={34} petal="#C4B5FD" />
        <Flower x={76} y={183} h={26} petal="#FDA4AF" />
        <Flower x={98} y={188} h={30} petal="#FBBF24" center="#FDF0DC" />
      </g>
      <g stroke="#6FBF8B" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.75}>
        <path d="M 258 190 Q 262 180 266 190" />
        <path d="M 330 194 Q 334 184 338 194" />
      </g>
      {/* bees */}
      <Bee x={196} y={92} delay={0.3} />
      <Bee x={132} y={66} s={0.7} delay={1.4} />
      <path d="M 150 74 Q 172 66 190 84" fill="none" stroke="#FBBF24" strokeWidth={1.6} strokeDasharray="2 5" strokeLinecap="round" opacity={0.6} />
      <Spark cx={222} cy={62} r={4} fill="#FDE68A" delay={0.9} />
    </g>
  );
}

/** 1 — hloubka: forest clearing, burrows, paw prints, mushrooms, hedgehog in the ferns, fireflies. */
function Hloubka() {
  return (
    <g>
      <rect width={360} height={200} fill="#CDE7D8" />
      {/* canopy */}
      <g fill="#7FC49A">
        <ellipse cx={28} cy={24} rx={62} ry={40} />
        <ellipse cx={128} cy={10} rx={54} ry={32} />
        <ellipse cx={244} cy={12} rx={58} ry={34} />
        <ellipse cx={338} cy={28} rx={56} ry={38} />
      </g>
      <g fill="#65B387" opacity={0.9}>
        <ellipse cx={78} cy={14} rx={44} ry={26} />
        <ellipse cx={300} cy={10} rx={48} ry={26} />
      </g>
      {/* sunbeams */}
      <g fill="#FDE68A" opacity={0.18}>
        <path d="M 96 34 L 74 154 L 128 154 L 130 34 Z" />
        <path d="M 258 30 L 240 148 L 286 148 L 292 30 Z" />
      </g>
      {/* trunks */}
      <g fill="#B08A6A">
        <rect x={38} y={52} width={16} height={104} rx={8} />
        <rect x={310} y={56} width={18} height={102} rx={9} />
      </g>
      <g fill="#9A7455" opacity={0.5}>
        <rect x={44} y={72} width={4} height={22} rx={2} />
        <rect x={317} y={80} width={4} height={20} rx={2} />
      </g>
      {/* clearing floor */}
      <path d="M 0 132 Q 90 118 180 130 Q 270 142 360 128 L 360 200 L 0 200 Z" fill="#A9D6AE" />
      <path d="M 0 158 Q 110 148 220 160 Q 300 168 360 156 L 360 200 L 0 200 Z" fill="#8FC79A" />
      {/* burrows */}
      <g>
        <ellipse cx={40} cy={158} rx={40} ry={19} fill="#C0A98D" />
        <path d="M 24 162 Q 26 142 42 142 Q 58 142 60 162 Z" fill="#7C6248" />
        <path d="M 24 162 Q 26 142 42 142 Q 58 142 60 162" fill="none" stroke="#A98D6E" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <g>
        <ellipse cx={306} cy={170} rx={34} ry={16} fill="#C0A98D" />
        <path d="M 292 173 Q 293 157 306 157 Q 319 157 320 173 Z" fill="#7C6248" />
        <path d="M 292 173 Q 293 157 306 157 Q 319 157 320 173" fill="none" stroke="#A98D6E" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      {/* paw trails, kept out of the calm bottom-centre */}
      <Paw x={56} y={194} rot={-22} s={0.95} />
      <Paw x={76} y={188} rot={-14} s={0.9} />
      <Paw x={96} y={182} rot={-8} s={0.85} />
      <Paw x={252} y={186} rot={20} s={0.9} />
      <Paw x={268} y={179} rot={14} s={0.85} />
      <Paw x={284} y={173} rot={8} s={0.8} />
      {/* hedgehog resting among the ferns */}
      <g>
        <path
          d="M 50 176 Q 46 160 58 152 Q 54 146 64 146 Q 62 138 72 141 Q 74 133 82 139 Q 88 134 92 143 Q 100 143 100 151 Q 110 156 108 166 Q 106 175 96 177 Z"
          fill="#8A7361"
        />
        <g stroke="#A08A76" strokeWidth={2} strokeLinecap="round" opacity={0.8}>
          <path d="M 62 158 L 56 152" />
          <path d="M 74 152 L 70 145" />
          <path d="M 86 150 L 84 143" />
        </g>
        <path d="M 100 163 Q 114 162 117 169 Q 114 176 100 175 Z" fill="#A08A76" />
        <circle cx={117} cy={169} r={2.4} fill="#6E5A4C" />
        <circle cx={99} cy={160} r={2} fill="#FDF6E7" />
        <circle cx={99.4} cy={160.2} r={1.3} fill="#6E5A4C" />
      </g>
      <Fern x={30} y={197} s={1.05} flip />
      <Fern x={52} y={200} s={0.8} flip />
      <Fern x={14} y={184} s={0.7} flip />
      <Fern x={318} y={196} s={1} flip />
      <Fern x={340} y={190} s={0.85} />
      <Fern x={274} y={198} s={0.8} />
      {/* mushrooms */}
      <Mushroom x={32} y={192} />
      <Mushroom x={58} y={199} s={0.75} cap="#C4B5FD" edge="#9F8AD9" />
      <Mushroom x={296} y={192} s={0.9} cap="#FBBF24" edge="#D9A93C" />
      <Mushroom x={332} y={198} s={0.7} />
      <Mushroom x={16} y={160} s={0.55} cap="#FDA4AF" edge="#E98598" />
      {/* fireflies */}
      <g>
        <circle cx={152} cy={104} r={16} fill="url(#bubsc-zviratka-glow)" className="bubsc-zviratka-glow" />
        <circle cx={152} cy={104} r={2.8} fill="#FDE68A" className="bubsc-zviratka-fly" />
        <circle cx={210} cy={90} r={14} fill="url(#bubsc-zviratka-glow)" className="bubsc-zviratka-glow" style={{ animationDelay: '1.1s' }} />
        <circle cx={210} cy={90} r={2.4} fill="#FDE68A" className="bubsc-zviratka-fly" style={{ animationDelay: '1.1s' }} />
        <circle cx={178} cy={126} r={12} fill="url(#bubsc-zviratka-glow)" className="bubsc-zviratka-glow" style={{ animationDelay: '2.1s' }} />
        <circle cx={178} cy={126} r={2.2} fill="#FDE68A" className="bubsc-zviratka-fly" style={{ animationDelay: '2.1s' }} />
        <circle cx={252} cy={118} r={2} fill="#FDE68A" className="bubsc-zviratka-fly" style={{ animationDelay: '0.6s' }} />
      </g>
    </g>
  );
}

/** 2 — finále: animal feast on the meadow, garlands, glowing lanterns, feathers and sparks. */
function Finale() {
  return (
    <g>
      <rect width={360} height={200} fill="#FCEEE2" />
      <circle cx={180} cy={64} r={104} fill="url(#bubsc-zviratka-glow)" opacity={0.5} />
      {/* party trees */}
      <g fill="#8ED5A2">
        <ellipse cx={20} cy={44} rx={50} ry={44} />
        <ellipse cx={340} cy={40} rx={52} ry={46} />
      </g>
      <g fill="#6FBF8B" opacity={0.9}>
        <ellipse cx={48} cy={20} rx={34} ry={26} />
        <ellipse cx={312} cy={18} rx={36} ry={26} />
      </g>
      <g fill="#B08A6A">
        <rect x={26} y={80} width={16} height={88} rx={8} />
        <rect x={320} y={78} width={16} height={90} rx={8} />
      </g>
      {/* meadow */}
      <path d="M 0 150 Q 100 140 200 152 Q 290 160 360 148 L 360 200 L 0 200 Z" fill="#A9DFB6" />
      <path d="M 0 174 Q 120 166 240 176 Q 310 182 360 172 L 360 200 L 0 200 Z" fill="#8FD3A2" opacity={0.85} />
      {/* garlands between the trees */}
      <Garland p0={[30, 54]} c={[180, 96]} p2={[330, 52]} count={9} shape="dot" />
      <Garland p0={[34, 86]} c={[180, 132]} p2={[326, 84]} count={11} />
      {/* little guest perched on the rope */}
      <g>
        <ellipse cx={198} cy={100} rx={9} ry={7.5} fill="#F9A8D4" />
        <circle cx={204} cy={94} r={5.4} fill="#F9A8D4" />
        <path d="M 208 93 L 214 95 L 208 97 Z" fill="#FBBF24" />
        <circle cx={205.5} cy={93} r={1.4} fill="#7A4A63" />
        <path d="M 193 100 Q 186 104 182 99" fill="none" stroke="#E98598" strokeWidth={2.2} strokeLinecap="round" />
        <g stroke="#D9A93C" strokeWidth={1.6} strokeLinecap="round">
          <path d="M 196 107 L 196 110" />
          <path d="M 201 107 L 201 110" />
        </g>
      </g>
      {/* lanterns */}
      <Lantern x={64} y={124} top={90} fill="#FDE68A" edge="#D9A93C" delay={0.2} />
      <Lantern x={112} y={136} top={104} fill="#F9A8D4" edge="#E98598" delay={1.1} />
      <Lantern x={250} y={130} top={102} fill="#C4B5FD" edge="#9F8AD9" delay={0.7} />
      <Lantern x={302} y={118} top={92} fill="#86EFAC" edge="#5FBF84" delay={1.7} />
      {/* feathers drifting over the party */}
      <Feather x={44} y={140} rot={-18} fill="#F9A8D4" edge="#E98598" delay={0.3} />
      <Feather x={150} y={62} rot={14} fill="#C4B5FD" edge="#9F8AD9" s={0.85} delay={1.5} />
      <Feather x={222} y={72} rot={-10} fill="#86EFAC" edge="#5FBF84" s={0.75} delay={2.4} />
      <Feather x={332} y={144} rot={20} fill="#FDE68A" edge="#D9A93C" s={0.9} delay={0.9} />
      {/* meadow trimmings, away from the calm bottom-centre */}
      <g stroke="#6FBF8B" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.7}>
        <path d="M 26 192 Q 30 182 34 192" />
        <path d="M 78 186 Q 82 176 86 186" />
        <path d="M 284 188 Q 288 178 292 188" />
        <path d="M 336 194 Q 340 184 344 194" />
      </g>
      <Flower x={48} y={190} h={22} petal="#F9A8D4" />
      <Flower x={318} y={186} h={20} petal="#C4B5FD" />
      {/* celebration sparks */}
      <Spark cx={86} cy={62} r={6} delay={0.2} />
      <Spark cx={140} cy={38} r={5} fill="#F9A8D4" delay={1} />
      <Spark cx={228} cy={34} r={5} fill="#C4B5FD" delay={1.8} />
      <Spark cx={288} cy={58} r={6} fill="#86EFAC" delay={0.6} />
      <Spark cx={180} cy={26} r={4} fill="#FDA4AF" delay={2.4} />
      <g opacity={0.85}>
        <circle cx={66} cy={168} r={2.6} fill="#F9A8D4" className="bubsc-zviratka-fly" />
        <circle cx={300} cy={172} r={2.4} fill="#C4B5FD" className="bubsc-zviratka-fly" style={{ animationDelay: '1.2s' }} />
        <circle cx={22} cy={122} r={2.2} fill="#FBBF24" className="bubsc-zviratka-fly" style={{ animationDelay: '2s' }} />
      </g>
    </g>
  );
}

export function ZviratkaScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-zviratka" role="presentation">
      <style>{CSS}</style>
      <Defs />
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
