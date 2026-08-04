// Detektivka — hravé pátrání, nikdy temné: městečko za odpoledne, večerní
// ulička se stopami, vyřešený případ na nástěnce.
// Structure mirrors kouzla.tsx (the reference scene): namespaced animations,
// three variant layers, calm bottom-centre zone (x 120–240, y 150–200).
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-detektivka { display: block; width: 100%; height: 100%; }
.bubsc-detektivka .bubsc-detektivka-star { transform-box: fill-box; transform-origin: center; animation: bubsc-detektivka-twinkle 2.9s ease-in-out infinite; }
.bubsc-detektivka .bubsc-detektivka-cloud { animation: bubsc-detektivka-drift 17s ease-in-out infinite alternate; }
.bubsc-detektivka .bubsc-detektivka-glow { animation: bubsc-detektivka-pulse 3.2s ease-in-out infinite; }
.bubsc-detektivka .bubsc-detektivka-think { animation: bubsc-detektivka-bob 5.2s ease-in-out infinite alternate; }
.bubsc-detektivka .bubsc-detektivka-tail { transform-box: fill-box; transform-origin: left bottom; animation: bubsc-detektivka-wag 4.6s ease-in-out infinite alternate; }
.bubsc-detektivka .bubsc-detektivka-confetti { transform-box: fill-box; transform-origin: center; animation: bubsc-detektivka-sway 3.4s ease-in-out infinite alternate; }
@keyframes bubsc-detektivka-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes bubsc-detektivka-drift { from { transform: translateX(0); } to { transform: translateX(16px); } }
@keyframes bubsc-detektivka-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 0.75; } }
@keyframes bubsc-detektivka-bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
@keyframes bubsc-detektivka-wag { from { transform: rotate(-7deg); } to { transform: rotate(9deg); } }
@keyframes bubsc-detektivka-sway { from { transform: translateY(-3px) rotate(-9deg); } to { transform: translateY(4px) rotate(11deg); } }
@media (prefers-reduced-motion: reduce) { .bubsc-detektivka * { animation: none !important; } }
`;

/** street level shared by the daytime town */
const GROUND = 150;

function Spark({ cx, cy, r, fill = '#FBBF24', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-detektivka-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

/** Curious little question mark — drawn, so it never depends on a font. */
function Query({ x, y, s, stroke }: { x: number; y: number; s: number; stroke: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M -4.6 -5.4 Q -4.6 -10.6 0 -10.6 Q 4.6 -10.6 4.6 -6.2 Q 4.6 -2.6 0.6 -1 Q 0 -0.6 0 1.6"
        fill="none"
        stroke={stroke}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={0} cy={5} r={1.8} fill={stroke} />
    </g>
  );
}

/** Cheerful town house — rounded ridge, warm windows, arched door. */
function House({ x, w, top, wall, roof }: { x: number; w: number; top: number; wall: string; roof: string }) {
  const cx = x + w / 2;
  return (
    <g>
      <path d={`M ${x - 7} ${top + 3} L ${cx - 7} ${top - 21} Q ${cx} ${top - 29} ${cx + 7} ${top - 21} L ${x + w + 7} ${top + 3} Z`} fill={roof} />
      <rect x={x} y={top} width={w} height={GROUND - top} fill={wall} />
      <rect x={x + 7} y={top + 9} width={12} height={12} rx={4} fill="#FDE68A" stroke={roof} strokeWidth={1.6} />
      <rect x={x + w - 19} y={top + 9} width={12} height={12} rx={4} fill="#FDE68A" stroke={roof} strokeWidth={1.6} />
      <path d={`M ${cx - 8} ${GROUND} L ${cx - 8} ${GROUND - 14} Q ${cx} ${GROUND - 24} ${cx + 8} ${GROUND - 14} L ${cx + 8} ${GROUND} Z`} fill={roof} />
    </g>
  );
}

/** Evening town block with lit windows. */
function Block({ x, w, top, wall, trim }: { x: number; w: number; top: number; wall: string; trim: string }) {
  const cols = [x + 10, x + w - 22];
  const rows = [top + 12, top + 34];
  return (
    <g>
      <rect x={x - 4} y={top - 6} width={w + 8} height={9} rx={4} fill={trim} />
      <rect x={x} y={top} width={w} height={200 - top} fill={wall} />
      {rows.map((wy) =>
        cols.map((wx) => (
          <g key={`${wx}-${wy}`}>
            <circle cx={wx + 6} cy={wy + 7} r={12} fill="#FDE68A" opacity={0.3} className="bubsc-detektivka-glow" style={{ animationDelay: `${((wx + wy) % 7) * 0.4}s` }} />
            <rect x={wx} y={wy} width={12} height={14} rx={4} fill="#FDE68A" stroke={trim} strokeWidth={1.4} />
          </g>
        )),
      )}
    </g>
  );
}

/** A single footprint on the alley cobbles — pale, so it reads on the dark street. */
function Print({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y}) translate(${x} ${y}) scale(${s})`} opacity={0.7}>
      <ellipse cx={0} cy={0} rx={4.2} ry={6} fill="#DCD1F4" />
      <ellipse cx={0.6} cy={-8} rx={3} ry={2.6} fill="#DCD1F4" />
    </g>
  );
}

const CONFETTI: { x: number; y: number; w: number; h: number; fill: string; rot: number; delay: number }[] = [
  { x: 12, y: 38, w: 10, h: 5, fill: '#F9A8D4', rot: 24, delay: 0 },
  { x: 24, y: 76, w: 8, h: 5, fill: '#86EFAC', rot: -18, delay: 0.7 },
  { x: 8, y: 116, w: 10, h: 5, fill: '#FBBF24', rot: 40, delay: 1.4 },
  { x: 26, y: 154, w: 9, h: 5, fill: '#C4B5FD', rot: -30, delay: 0.4 },
  { x: 58, y: 170, w: 10, h: 5, fill: '#FDA4AF', rot: 14, delay: 1.9 },
  { x: 94, y: 160, w: 8, h: 5, fill: '#F9A8D4', rot: -24, delay: 1.1 },
  { x: 62, y: 10, w: 9, h: 5, fill: '#86EFAC', rot: 32, delay: 2.1 },
  { x: 136, y: 6, w: 10, h: 5, fill: '#FBBF24', rot: -12, delay: 0.9 },
  { x: 202, y: 4, w: 9, h: 5, fill: '#C4B5FD', rot: 22, delay: 1.6 },
  { x: 264, y: 8, w: 10, h: 5, fill: '#F9A8D4', rot: -28, delay: 0.2 },
  { x: 330, y: 22, w: 9, h: 5, fill: '#86EFAC', rot: 18, delay: 1.3 },
  { x: 342, y: 64, w: 10, h: 5, fill: '#FDA4AF', rot: -36, delay: 2.3 },
  { x: 334, y: 108, w: 8, h: 5, fill: '#FBBF24', rot: 26, delay: 0.6 },
  { x: 318, y: 158, w: 10, h: 5, fill: '#C4B5FD', rot: -20, delay: 1.8 },
  { x: 274, y: 172, w: 9, h: 5, fill: '#86EFAC', rot: 12, delay: 0.5 },
  { x: 250, y: 156, w: 8, h: 5, fill: '#F9A8D4', rot: -34, delay: 2.5 },
];

/** 0 — setkání: sleepy little town in the afternoon, first questions in the air. */
function Setkani() {
  return (
    <g>
      <rect width={360} height={200} fill="#FFEFDC" />
      <circle cx={318} cy={34} r={17} fill="#FDE68A" opacity={0.95} />
      <circle cx={318} cy={34} r={27} fill="#FDE68A" opacity={0.3} className="bubsc-detektivka-glow" />
      <g className="bubsc-detektivka-cloud">
        <ellipse cx={238} cy={30} rx={30} ry={11} fill="#FFFFFF" opacity={0.85} />
        <ellipse cx={258} cy={36} rx={20} ry={8} fill="#FFFFFF" opacity={0.7} />
      </g>
      {/* distant rooftops — depth without clutter */}
      {[
        { x: 2, w: 30, top: 126 },
        { x: 38, w: 24, top: 132 },
        { x: 68, w: 34, top: 120 },
        { x: 108, w: 26, top: 130 },
        { x: 140, w: 32, top: 124 },
        { x: 178, w: 24, top: 132 },
        { x: 208, w: 30, top: 122 },
        { x: 244, w: 26, top: 130 },
        { x: 276, w: 34, top: 126 },
        { x: 316, w: 30, top: 132 },
      ].map((d) => (
        <g key={d.x} fill="#F6DFC4">
          <path d={`M ${d.x - 4} ${d.top + 3} L ${d.x + d.w / 2} ${d.top - 13} L ${d.x + d.w + 4} ${d.top + 3} Z`} />
          <rect x={d.x} y={d.top} width={d.w} height={GROUND - d.top} />
        </g>
      ))}
      {/* street */}
      <rect x={0} y={GROUND} width={360} height={50} fill="#F4E1CB" />
      <rect x={0} y={GROUND} width={360} height={5} fill="#E8D2B4" />
      <path d="M 18 168 L 96 168 M 262 174 L 344 174" stroke="#EBD6BB" strokeWidth={3} strokeLinecap="round" />
      {/* low garden wall with the magnifier resting on it */}
      <rect x={4} y={132} width={62} height={18} rx={6} fill="#EBD8BE" stroke="#D6BF9E" strokeWidth={2} />
      <path d="M 10 141 L 60 141 M 24 132 L 24 141 M 46 141 L 46 150" stroke="#D6BF9E" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M 40 150 L 56 128" stroke="#D9A93C" strokeWidth={6} strokeLinecap="round" />
      <circle cx={62} cy={118} r={13} fill="#E8F4FB" opacity={0.92} />
      <circle cx={62} cy={118} r={13} fill="none" stroke="#8B78D0" strokeWidth={4} />
      <path d="M 56 113 Q 59 108 65 109" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      {/* street lamp, still unlit in the afternoon */}
      <path d="M 88 150 L 88 66 Q 88 52 76 52" stroke="#A98FDD" strokeWidth={4} strokeLinecap="round" fill="none" />
      <ellipse cx={88} cy={150} rx={9} ry={3.5} fill="#A98FDD" />
      <path d="M 69 54 L 83 54 L 80 67 L 72 67 Z" fill="#FDE68A" stroke="#D9A93C" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={76} cy={62} r={9} fill="#FDE68A" opacity={0.35} className="bubsc-detektivka-glow" />
      {/* the row of houses */}
      <House x={100} w={48} top={102} wall="#C4B5FD" roof="#8B78D0" />
      <House x={156} w={58} top={88} wall="#F9A8D4" roof="#E27BAE" />
      <House x={222} w={50} top={106} wall="#86EFAC" roof="#4FBF82" />
      <House x={280} w={50} top={96} wall="#FDA4AF" roof="#EE8090" />
      {/* wondering clouds over the tall roof */}
      <g className="bubsc-detektivka-think">
        <circle cx={160} cy={72} r={3.4} fill="#FFFFFF" opacity={0.9} />
        <circle cx={168} cy={62} r={5.4} fill="#FFFFFF" opacity={0.92} />
        <circle cx={166} cy={40} r={11} fill="#FFFFFF" opacity={0.95} />
        <circle cx={208} cy={40} r={10} fill="#FFFFFF" opacity={0.95} />
        <circle cx={186} cy={31} r={17} fill="#FFFFFF" />
        <Query x={186} y={30} s={1.15} stroke="#8B78D0" />
        <Query x={166} y={40} s={0.55} stroke="#E27BAE" />
        <Query x={208} y={40} s={0.5} stroke="#4FBF82" />
      </g>
      {/* two little birds */}
      <path d="M 116 44 Q 121 39 126 44 M 126 44 Q 131 39 136 44" stroke="#B79DE8" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d="M 246 58 Q 250 54 254 58 M 254 58 Q 258 54 262 58" stroke="#B79DE8" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Spark cx={40} cy={62} r={5} delay={0.4} />
      <Spark cx={276} cy={40} r={4} fill="#F9A8D4" delay={1.5} />
    </g>
  );
}

/** 1 — hloubka: evening alley, footprints turning the corner, a cat keeping watch. */
function Hloubka() {
  return (
    <g>
      <rect width={360} height={200} fill="#CFC4EC" />
      <path d="M 296 24 A 16 16 0 1 0 312 48 A 20 20 0 0 1 296 24 Z" fill="#FDE68A" opacity={0.95} />
      <Spark cx={132} cy={26} r={5} fill="#FFF3C4" delay={0.2} />
      <Spark cx={186} cy={16} r={4} fill="#FFFFFF" delay={1.1} />
      <Spark cx={232} cy={38} r={4.5} fill="#FDE68A" delay={2} />
      <Spark cx={70} cy={22} r={4} fill="#FFF3C4" delay={1.6} />
      <Spark cx={258} cy={12} r={3.4} fill="#FFFFFF" delay={0.8} />
      <Spark cx={340} cy={70} r={4} fill="#FDE68A" delay={2.4} />
      {/* far side of the street */}
      <Block x={100} w={54} top={102} wall="#B7A4E2" trim="#A18CD6" />
      <Block x={158} w={58} top={86} wall="#BDABE6" trim="#A791DB" />
      <Block x={220} w={46} top={98} wall="#B29EDF" trim="#9C86D3" />
      <Block x={270} w={40} top={110} wall="#BAA8E4" trim="#A48FD8" />
      {/* alley cobbles */}
      <rect x={0} y={150} width={360} height={50} fill="#B3A2DF" />
      <rect x={0} y={150} width={360} height={4} fill="#A28FD4" />
      <path d="M 246 166 L 316 166 M 262 182 L 336 182" stroke="#A896D8" strokeWidth={3} strokeLinecap="round" />
      {/* light pooling out of a window */}
      <ellipse cx={98} cy={170} rx={26} ry={9} fill="#FDE68A" opacity={0.22} className="bubsc-detektivka-glow" />
      {/* the trail — leading around the corner */}
      <Print x={119} y={192} rot={-16} s={1} />
      <Print x={106} y={181} rot={-24} s={0.88} />
      <Print x={113} y={170} rot={-16} s={0.76} />
      <Print x={101} y={161} rot={-26} s={0.64} />
      <Print x={106} y={153} rot={-18} s={0.54} />
      {/* foreground corner the trail disappears behind */}
      <rect x={-10} y={34} width={112} height={166} rx={10} fill="#9C82D6" />
      <rect x={-10} y={30} width={116} height={10} rx={5} fill="#8A6EC9" />
      {[48, 92, 136].map((wy) =>
        [12, 62].map((wx) => (
          <g key={`${wx}-${wy}`}>
            <circle cx={wx + 14} cy={wy + 13} r={19} fill="#FDE68A" opacity={0.26} className="bubsc-detektivka-glow" style={{ animationDelay: `${(wy % 5) * 0.5}s` }} />
            <rect x={wx} y={wy} width={28} height={26} rx={7} fill="#FDE68A" stroke="#8A6EC9" strokeWidth={2} />
            <path d={`M ${wx + 14} ${wy} L ${wx + 14} ${wy + 26} M ${wx} ${wy + 13} L ${wx + 28} ${wy + 13}`} stroke="#8A6EC9" strokeWidth={1.6} />
          </g>
        )),
      )}
      {/* wall lamp on the corner */}
      <path d="M 102 96 L 112 96" stroke="#8A6EC9" strokeWidth={3} strokeLinecap="round" />
      <path d="M 106 96 L 118 96 L 115 108 L 109 108 Z" fill="#FDE68A" stroke="#D9A93C" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={112} cy={104} r={11} fill="#FDE68A" opacity={0.3} className="bubsc-detektivka-glow" />
      {/* right-hand wall with a friendly cat on top */}
      <rect x={282} y={130} width={90} height={70} fill="#9C82D6" />
      <rect x={278} y={124} width={96} height={10} rx={5} fill="#8A6EC9" />
      <path className="bubsc-detektivka-tail" d="M 306 120 Q 292 118 295 102" stroke="#7A61B6" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M 304 124 Q 302 108 314 103 Q 317 92 328 92 Q 339 92 341 103 Q 343 112 341 124 Z" fill="#7A61B6" />
      <path d="M 320 94 L 319 84 L 327 90 Z" fill="#7A61B6" />
      <path d="M 335 94 L 338 85 L 340 95 Z" fill="#7A61B6" />
      <circle cx={335} cy={100} r={2} fill="#FDE68A" />
      <circle cx={326} cy={100} r={1.6} fill="#FDE68A" opacity={0.75} />
    </g>
  );
}

/** 2 — finále: case closed — the board, the threads, a big golden tick. */
function Finale() {
  return (
    <g>
      <rect width={360} height={200} fill="#FFF3E9" />
      <path d="M 10 -4 Q 30 20 10 44 Q -8 66 12 90" stroke="#F9A8D4" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d="M 350 -4 Q 330 20 350 44 Q 368 66 348 90" stroke="#86EFAC" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d="M 0 174 Q 180 166 360 174 L 360 200 L 0 200 Z" fill="#F8E4D3" />
      {/* the case board */}
      <rect x={38} y={20} width={284} height={126} rx={14} fill="#F1D9B9" stroke="#D9BC94" strokeWidth={3.5} />
      <rect x={48} y={30} width={264} height={106} rx={9} fill="#F8E7CD" />
      {/* threads between the pins */}
      <g stroke="#F472B6" strokeWidth={2} fill="none" opacity={0.75} strokeLinecap="round">
        <path d="M 82 48 Q 180 22 282 50" />
        <path d="M 82 48 Q 122 82 86 104" />
        <path d="M 282 50 Q 248 84 280 106" />
        <path d="M 86 104 Q 180 136 280 106" />
      </g>
      {/* clue cards */}
      {[
        { x: 60, y: 42, w: 44, h: 30, rot: -5, pin: '#F9A8D4', px: 82, py: 46 },
        { x: 260, y: 44, w: 44, h: 30, rot: 6, pin: '#86EFAC', px: 282, py: 50 },
        { x: 64, y: 98, w: 44, h: 30, rot: 5, pin: '#C4B5FD', px: 86, py: 104 },
        { x: 258, y: 100, w: 44, h: 30, rot: -6, pin: '#FDA4AF', px: 280, py: 106 },
      ].map((c) => (
        <g key={`${c.x}-${c.y}`}>
          <g transform={`rotate(${c.rot} ${c.x + c.w / 2} ${c.y + c.h / 2})`}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={5} fill="#FFFFFF" stroke="#E7D3B4" strokeWidth={1.6} />
            <rect x={c.x + 7} y={c.y + 9} width={30} height={3.4} rx={1.7} fill="#E4D2EE" />
            <rect x={c.x + 7} y={c.y + 16} width={22} height={3.4} rx={1.7} fill="#EEDCF3" />
            <rect x={c.x + 7} y={c.y + 23} width={26} height={3.4} rx={1.7} fill="#E4D2EE" />
          </g>
          <circle cx={c.px} cy={c.py} r={4} fill={c.pin} />
          <circle cx={c.px - 1.2} cy={c.py - 1.4} r={1.3} fill="#FFFFFF" opacity={0.85} />
        </g>
      ))}
      {/* solved! a tick made of golden light */}
      <path d="M 132 90 L 162 120 L 232 56" stroke="#FBBF24" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.26} className="bubsc-detektivka-glow" />
      <path d="M 132 90 L 162 120 L 232 56" stroke="#FBBF24" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 132 90 L 162 120 L 232 56" stroke="#FDE68A" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Spark cx={124} cy={80} r={5.4} delay={0.1} />
      <Spark cx={142} cy={112} r={3.8} fill="#FDE68A" delay={0.9} />
      <Spark cx={167} cy={130} r={4.6} delay={0.5} />
      <Spark cx={186} cy={92} r={3.8} fill="#FDE68A" delay={1.6} />
      <Spark cx={214} cy={68} r={4} delay={1.2} />
      <Spark cx={240} cy={48} r={6} fill="#FDE68A" delay={2} />
      <Spark cx={152} cy={98} r={2.8} fill="#FDE68A" delay={0.7} />
      <Spark cx={176} cy={116} r={3} delay={1.9} />
      <Spark cx={200} cy={90} r={2.6} fill="#FDE68A" delay={1.1} />
      <Spark cx={226} cy={72} r={3} delay={2.4} />
      <Spark cx={146} cy={76} r={3.2} fill="#FDE68A" delay={1.5} />
      {/* confetti */}
      {CONFETTI.map((c) => (
        <g key={`${c.x}-${c.y}`} transform={`rotate(${c.rot} ${c.x + c.w / 2} ${c.y + c.h / 2})`}>
          <rect
            className="bubsc-detektivka-confetti"
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
      <circle cx={44} cy={60} r={3.4} fill="#C4B5FD" className="bubsc-detektivka-confetti" style={{ animationDelay: '1.2s' }} />
      <circle cx={314} cy={40} r={3} fill="#F9A8D4" className="bubsc-detektivka-confetti" style={{ animationDelay: '0.5s' }} />
      <circle cx={20} cy={140} r={3.2} fill="#86EFAC" className="bubsc-detektivka-confetti" style={{ animationDelay: '2.2s' }} />
      <circle cx={344} cy={132} r={3.4} fill="#FBBF24" className="bubsc-detektivka-confetti" style={{ animationDelay: '1.7s' }} />
    </g>
  );
}

export function DetektivkaScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-detektivka" role="presentation">
      <style>{CSS}</style>
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
