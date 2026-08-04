// Kouzla a magie — REFERENCE scene implementation.
// Read this before writing a new genre scene: it shows the variant
// progression (0 setkání → 1 hloubka → 2 finále), layer structure, the calm
// bottom-center zone and the namespaced-animation conventions.
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-kouzla { display: block; width: 100%; height: 100%; }
.bubsc-kouzla .bubsc-kouzla-star { transform-box: fill-box; transform-origin: center; animation: bubsc-kouzla-twinkle 2.6s ease-in-out infinite; }
.bubsc-kouzla .bubsc-kouzla-cloud { animation: bubsc-kouzla-drift 14s ease-in-out infinite alternate; }
.bubsc-kouzla .bubsc-kouzla-fly { animation: bubsc-kouzla-float 4s ease-in-out infinite alternate; }
.bubsc-kouzla .bubsc-kouzla-glow { animation: bubsc-kouzla-pulse 3s ease-in-out infinite; }
@keyframes bubsc-kouzla-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes bubsc-kouzla-drift { from { transform: translateX(0); } to { transform: translateX(14px); } }
@keyframes bubsc-kouzla-float { from { transform: translateY(0); } to { transform: translateY(-6px); } }
@keyframes bubsc-kouzla-pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.9; } }
@media (prefers-reduced-motion: reduce) { .bubsc-kouzla * { animation: none !important; } }
`;

function Spark({ cx, cy, r, fill = '#FBBF24', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-kouzla-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

/** 0 — setkání: dawn meadow, path into the unknown, first sparkles. */
function Setkani() {
  return (
    <g>
      <rect width={360} height={200} fill="#E9DDFC" />
      <circle cx={300} cy={44} r={20} fill="#FDE68A" opacity={0.9} />
      <circle cx={300} cy={44} r={30} fill="#FDE68A" opacity={0.25} className="bubsc-kouzla-glow" />
      <g className="bubsc-kouzla-cloud">
        <ellipse cx={80} cy={40} rx={34} ry={12} fill="#FFFFFF" opacity={0.85} />
        <ellipse cx={104} cy={46} rx={24} ry={9} fill="#FFFFFF" opacity={0.7} />
      </g>
      {/* soft hills */}
      <path d="M 0 150 Q 70 118 150 142 Q 240 168 360 132 L 360 200 L 0 200 Z" fill="#C9B2F2" />
      <path d="M 0 168 Q 90 146 190 166 Q 280 184 360 164 L 360 200 L 0 200 Z" fill="#AE92E8" />
      {/* winding path, fading into the hills — invitation to set out */}
      <path d="M 176 200 Q 168 178 192 166 Q 214 156 206 144" stroke="#F6EFFF" strokeWidth={15} strokeLinecap="round" fill="none" opacity={1} />
      <Spark cx={60} cy={82} r={6} delay={0.3} />
      <Spark cx={252} cy={70} r={5} fill="#F9A8D4" delay={1.2} />
      <Spark cx={140} cy={56} r={4} fill="#C4B5FD" delay={2} />
    </g>
  );
}

/** 1 — hloubka: dusk forest, lanterns, fireflies. */
function Hloubka() {
  return (
    <g>
      <rect width={360} height={200} fill="#C9B7EF" />
      <path d="M 250 26 A 17 17 0 1 0 267 52 A 21 21 0 0 1 250 26 Z" fill="#FDE68A" opacity={0.95} />
      {/* tree silhouettes — rounded, friendly, never spooky */}
      <g fill="#9A7BD8">
        <ellipse cx={38} cy={92} rx={30} ry={44} />
        <rect x={33} y={120} width={10} height={44} rx={5} />
        <ellipse cx={322} cy={84} rx={34} ry={50} />
        <rect x={317} y={118} width={10} height={50} rx={5} />
      </g>
      <g fill="#8666CC">
        <ellipse cx={96} cy={104} rx={22} ry={34} />
        <rect x={92} y={126} width={8} height={40} rx={4} />
        <ellipse cx={268} cy={100} rx={24} ry={36} />
        <rect x={264} y={124} width={8} height={42} rx={4} />
      </g>
      {/* hanging lanterns */}
      <g>
        <path d="M 96 70 L 96 84" stroke="#8B78D0" strokeWidth={2} />
        <rect x={90} y={84} width={12} height={15} rx={4} fill="#FDE68A" stroke="#D9A93C" strokeWidth={1.6} />
        <circle cx={96} cy={91} r={8} fill="#FDE68A" opacity={0.4} className="bubsc-kouzla-glow" />
        <path d="M 268 62 L 268 78" stroke="#8B78D0" strokeWidth={2} />
        <rect x={262} y={78} width={12} height={15} rx={4} fill="#FDE68A" stroke="#D9A93C" strokeWidth={1.6} />
        <circle cx={268} cy={85} r={8} fill="#FDE68A" opacity={0.4} className="bubsc-kouzla-glow" style={{ animationDelay: '1.4s' }} />
      </g>
      <path d="M 0 164 Q 120 148 220 164 Q 300 176 360 160 L 360 200 L 0 200 Z" fill="#9A7BD8" />
      {/* fireflies */}
      <g fill="#FDE68A">
        <circle className="bubsc-kouzla-fly" cx={150} cy={112} r={2.6} />
        <circle className="bubsc-kouzla-fly" cx={214} cy={124} r={2.2} style={{ animationDelay: '1s' }} />
        <circle className="bubsc-kouzla-fly" cx={122} cy={138} r={2} style={{ animationDelay: '2.2s' }} />
      </g>
    </g>
  );
}

/** 2 — finále: castle hall, stained glass, celebratory sparkles. */
function Finale() {
  return (
    <g>
      <rect width={360} height={200} fill="#F0DCEC" />
      {/* stained-glass arch window */}
      <g transform="translate(180 0)">
        <path d="M -52 200 L -52 84 Q 0 30 52 84 L 52 200 Z" fill="#DFC0E8" stroke="#B98BCB" strokeWidth={3} />
        <path d="M -40 200 L -40 90 Q 0 44 40 90 L 40 200 Z" fill="#FDF0FD" />
        <g opacity={0.75}>
          <path d="M -40 120 L 40 120 M -40 156 L 40 156 M 0 48 L 0 200" stroke="#CBA8D9" strokeWidth={2.4} />
          <path d="M -40 90 Q 0 44 40 90" fill="none" stroke="#CBA8D9" strokeWidth={2.4} />
          <path d="M -20 66 L -20 200 M 20 66 L 20 200" stroke="#CBA8D9" strokeWidth={1.6} />
        </g>
        <circle cx={0} cy={86} r={12} fill="#FDE68A" opacity={0.9} className="bubsc-kouzla-glow" />
      </g>
      {/* columns */}
      <g fill="#D9BCE2">
        <rect x={26} y={70} width={16} height={130} rx={7} />
        <rect x={318} y={70} width={16} height={130} rx={7} />
      </g>
      {/* garlands */}
      <path d="M 42 76 Q 110 108 172 84" stroke="#F9A8D4" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M 188 84 Q 250 108 318 76" stroke="#86EFAC" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* celebration sparkles — finale feel */}
      <Spark cx={70} cy={48} r={7} delay={0.2} />
      <Spark cx={130} cy={30} r={5} fill="#F9A8D4" delay={1} />
      <Spark cx={230} cy={28} r={5} fill="#C4B5FD" delay={1.7} />
      <Spark cx={296} cy={46} r={6} fill="#86EFAC" delay={0.6} />
      <path d="M 0 184 Q 180 172 360 184 L 360 200 L 0 200 Z" fill="#DFC0E8" />
    </g>
  );
}

export function KouzlaScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-kouzla" role="presentation">
      <style>{CSS}</style>
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
