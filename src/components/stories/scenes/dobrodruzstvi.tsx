// Dobrodružství — outbound trail → jungle gorge → summit at sunset.
// Structure, drawing style and animation conventions follow ./kouzla.tsx
// (the reference scene); contract in ./types.ts.
import type { StorySceneProps } from './types';

const CSS = `
.bubsc-dobrodruzstvi { display: block; width: 100%; height: 100%; }
.bubsc-dobrodruzstvi .bubsc-dobrodruzstvi-cloud { animation: bubsc-dobrodruzstvi-drift 16s ease-in-out infinite alternate; }
.bubsc-dobrodruzstvi .bubsc-dobrodruzstvi-fly { animation: bubsc-dobrodruzstvi-float 4.4s ease-in-out infinite alternate; }
.bubsc-dobrodruzstvi .bubsc-dobrodruzstvi-glow { animation: bubsc-dobrodruzstvi-pulse 3.2s ease-in-out infinite; }
.bubsc-dobrodruzstvi .bubsc-dobrodruzstvi-star { transform-box: fill-box; transform-origin: center; animation: bubsc-dobrodruzstvi-twinkle 2.8s ease-in-out infinite; }
.bubsc-dobrodruzstvi .bubsc-dobrodruzstvi-fall { animation: bubsc-dobrodruzstvi-stream 2.6s linear infinite; }
@keyframes bubsc-dobrodruzstvi-drift { from { transform: translateX(0); } to { transform: translateX(16px); } }
@keyframes bubsc-dobrodruzstvi-float { from { transform: translateY(0); } to { transform: translateY(-7px); } }
@keyframes bubsc-dobrodruzstvi-pulse { 0%,100% { opacity: 0.32; } 50% { opacity: 0.7; } }
@keyframes bubsc-dobrodruzstvi-twinkle { 0%,100% { transform: scale(0.7); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } }
@keyframes bubsc-dobrodruzstvi-stream { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -26; } }
@media (prefers-reduced-motion: reduce) { .bubsc-dobrodruzstvi * { animation: none !important; } }
`;

/** Shared gradients — soft light falloff instead of hard-edged glow discs. */
function Defs() {
  return (
    <defs>
      <radialGradient id="bubsc-dobrodruzstvi-glow">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity={0.95} />
        <stop offset="55%" stopColor="#FDE68A" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="bubsc-dobrodruzstvi-beam" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="bubsc-dobrodruzstvi-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FDF0D8" stopOpacity={0} />
        <stop offset="100%" stopColor="#FDF0D8" stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id="bubsc-dobrodruzstvi-sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C9BAF6" />
        <stop offset="48%" stopColor="#FBC3CE" />
        <stop offset="100%" stopColor="#FDE3B4" />
      </linearGradient>
    </defs>
  );
}

/** Soft four-point sparkle — same silhouette as the reference scene. */
function Spark({ cx, cy, r, fill = '#FBBF24', delay = 0 }: { cx: number; cy: number; r: number; fill?: string; delay?: number }) {
  const d = `M ${cx} ${cy - r} Q ${cx + r * 0.25} ${cy - r * 0.25} ${cx + r} ${cy} Q ${cx + r * 0.25} ${cy + r * 0.25} ${cx} ${cy + r} Q ${cx - r * 0.25} ${cy + r * 0.25} ${cx - r} ${cy} Q ${cx - r * 0.25} ${cy - r * 0.25} ${cx} ${cy - r} Z`;
  return <path className="bubsc-dobrodruzstvi-star" style={{ animationDelay: `${delay}s` }} d={d} fill={fill} />;
}

/** Round pastel butterfly; the animated wrapper only translates, the inner g holds the placement. */
function Butterfly({ x, y, fill, edge, s = 1, delay = 0 }: { x: number; y: number; fill: string; edge: string; s?: number; delay?: number }) {
  return (
    <g className="bubsc-dobrodruzstvi-fly" style={{ animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx={-5} cy={-3} rx={5.2} ry={4} fill={fill} stroke={edge} strokeWidth={1.2} transform="rotate(-20 -5 -3)" />
        <ellipse cx={5} cy={-3} rx={5.2} ry={4} fill={fill} stroke={edge} strokeWidth={1.2} transform="rotate(20 5 -3)" />
        <ellipse cx={-3.8} cy={3.4} rx={3.6} ry={2.8} fill={fill} opacity={0.8} />
        <ellipse cx={3.8} cy={3.4} rx={3.6} ry={2.8} fill={fill} opacity={0.8} />
        <rect x={-1.1} y={-5} width={2.2} height={10} rx={1.1} fill="#A9805A" />
      </g>
    </g>
  );
}

/** 0 — setkání: morning meadow, a trail to the horizon, signpost and a map in the grass. */
function Setkani() {
  return (
    <g>
      <rect width={360} height={200} fill="#E7F3FD" />
      <rect y={72} width={360} height={68} fill="url(#bubsc-dobrodruzstvi-haze)" />
      {/* morning sun */}
      <circle cx={300} cy={40} r={38} fill="url(#bubsc-dobrodruzstvi-glow)" className="bubsc-dobrodruzstvi-glow" />
      <circle cx={300} cy={40} r={19} fill="#FDE68A" />
      {/* drifting clouds */}
      <g className="bubsc-dobrodruzstvi-cloud">
        <ellipse cx={70} cy={38} rx={32} ry={12} fill="#FFFFFF" opacity={0.9} />
        <ellipse cx={92} cy={44} rx={22} ry={9} fill="#FFFFFF" opacity={0.72} />
      </g>
      <g className="bubsc-dobrodruzstvi-cloud" style={{ animationDelay: '3.5s', animationDuration: '21s' }}>
        <ellipse cx={196} cy={26} rx={24} ry={9} fill="#FFFFFF" opacity={0.8} />
        <ellipse cx={214} cy={31} rx={16} ry={7} fill="#FFFFFF" opacity={0.62} />
      </g>
      {/* birds far away */}
      <g fill="none" stroke="#C4B5FD" strokeWidth={2} strokeLinecap="round" opacity={0.75}>
        <path className="bubsc-dobrodruzstvi-fly" d="M 138 62 Q 144 57 150 62 Q 156 57 162 62" />
        <path className="bubsc-dobrodruzstvi-fly" style={{ animationDelay: '1.6s' }} d="M 176 76 Q 181 72 186 76" />
      </g>
      {/* rolling hills */}
      <path d="M 0 122 Q 60 96 126 116 Q 190 134 250 110 Q 310 90 360 112 L 360 200 L 0 200 Z" fill="#CBEBD5" />
      <path d="M 0 140 Q 80 120 160 138 Q 250 158 360 132 L 360 200 L 0 200 Z" fill="#A9DFB8" />
      <path d="M 0 158 Q 120 146 220 158 Q 300 166 360 154 L 360 200 L 0 200 Z" fill="#8FD3A2" />
      {/* trail fading into the horizon */}
      <path d="M 40 200 Q 84 174 120 154 Q 142 142 155 132 Q 146 146 132 160 Q 96 184 82 200 Z" fill="#F5E3C3" opacity={0.95} />
      {/* signpost beside the trail */}
      <g>
        <ellipse cx={288} cy={172} rx={22} ry={5} fill="#7CC492" opacity={0.45} />
        <rect x={285} y={112} width={7} height={60} rx={3.5} fill="#CBA37A" stroke="#A9805A" strokeWidth={2} />
        <path d="M 252 118 L 286 118 L 286 132 L 252 132 L 244 125 Z" fill="#FDE9C8" stroke="#CBA37A" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 291 140 L 322 140 L 330 147 L 322 154 L 291 154 Z" fill="#FDE9C8" stroke="#CBA37A" strokeWidth={2} strokeLinejoin="round" />
        <g stroke="#CBA37A" strokeWidth={2} strokeLinecap="round" opacity={0.55}>
          <path d="M 256 125 L 278 125" />
          <path d="M 297 147 L 316 147" />
        </g>
      </g>
      {/* map in the grass — dotted route, X marks the spot */}
      <g transform="rotate(-6 60 170)">
        <path d="M 22 156 L 62 150 L 100 158 L 98 186 L 60 178 L 24 184 Z" fill="#FDF3DF" stroke="#DDBF93" strokeWidth={2} strokeLinejoin="round" />
        <path d="M 62 150 L 60 178" stroke="#DDBF93" strokeWidth={1.6} opacity={0.7} />
        <path d="M 34 174 Q 50 162 66 170 Q 80 176 88 163" fill="none" stroke="#F9A8D4" strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" />
        <path d="M 84 159 L 92 167 M 92 159 L 84 167" stroke="#FDA4AF" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      {/* meadow details, kept off the calm bottom-centre */}
      <g stroke="#6FBF8B" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.75}>
        <path d="M 104 192 Q 108 182 112 192" />
        <path d="M 252 188 Q 256 178 260 188" />
        <path d="M 332 194 Q 336 184 340 194" />
      </g>
      <g>
        <circle cx={16} cy={190} r={4} fill="#F9A8D4" />
        <circle cx={348} cy={182} r={4} fill="#C4B5FD" />
      </g>
      <Spark cx={330} cy={70} r={5} delay={0.4} />
      <Spark cx={262} cy={58} r={4} fill="#F9A8D4" delay={1.5} />
    </g>
  );
}

/** 1 — hloubka: jungle gorge, vines, distant waterfall, rope bridge, butterflies. */
function Hloubka() {
  return (
    <g>
      <rect width={360} height={200} fill="#BFE0D2" />
      {/* canyon walls — far, then nearer */}
      <path d="M 0 0 L 96 0 Q 84 60 96 108 Q 100 152 88 200 L 0 200 Z" fill="#CBB6A0" />
      <path d="M 360 0 L 268 0 Q 280 56 270 104 Q 262 152 274 200 L 360 200 Z" fill="#CBB6A0" />
      <path d="M 0 0 L 60 0 Q 50 70 62 130 Q 68 172 54 200 L 0 200 Z" fill="#B49C86" />
      <path d="M 360 0 L 306 0 Q 316 66 304 124 Q 296 170 310 200 L 360 200 Z" fill="#B49C86" />
      {/* distant waterfall spilling over a rock ledge */}
      <g>
        <ellipse cx={180} cy={28} rx={74} ry={36} fill="#CBB6A0" />
        <ellipse cx={180} cy={22} rx={58} ry={28} fill="#B49C86" opacity={0.45} />
        <path d="M 156 48 Q 180 42 204 48 L 210 140 L 150 140 Z" fill="#DCEFFA" opacity={0.92} />
        <g stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.65} strokeDasharray="11 15" className="bubsc-dobrodruzstvi-fall">
          <path d="M 168 52 L 167 136" />
          <path d="M 181 50 L 181 136" style={{ animationDelay: '0.7s' }} />
          <path d="M 194 52 L 195 136" style={{ animationDelay: '1.3s' }} />
        </g>
        <ellipse cx={180} cy={140} rx={46} ry={11} fill="#DCEFFA" opacity={0.9} />
        <ellipse cx={180} cy={138} rx={30} ry={6} fill="#FFFFFF" opacity={0.55} className="bubsc-dobrodruzstvi-glow" />
        <ellipse cx={180} cy={146} rx={54} ry={10} fill="#BFE0D2" opacity={0.75} />
      </g>
      {/* hanging vines */}
      <g fill="none" stroke="#5FAE84" strokeWidth={3} strokeLinecap="round">
        <path d="M 34 0 Q 44 26 36 52 Q 30 70 38 86" />
        <path d="M 118 0 Q 128 20 120 40 Q 114 56 122 70" />
        <path d="M 238 0 Q 228 22 236 44 Q 242 60 234 74" />
        <path d="M 322 0 Q 312 24 320 48 Q 326 64 318 80" />
      </g>
      <g fill="#7FC49A">
        <ellipse cx={30} cy={30} rx={7} ry={3.6} transform="rotate(-26 30 30)" />
        <ellipse cx={40} cy={58} rx={6} ry={3.2} transform="rotate(22 40 58)" />
        <ellipse cx={125} cy={26} rx={6} ry={3.2} transform="rotate(24 125 26)" />
        <ellipse cx={116} cy={52} rx={6.5} ry={3.4} transform="rotate(-20 116 52)" />
        <ellipse cx={231} cy={28} rx={6} ry={3.2} transform="rotate(-24 231 28)" />
        <ellipse cx={240} cy={56} rx={6.5} ry={3.4} transform="rotate(20 240 56)" />
        <ellipse cx={327} cy={32} rx={7} ry={3.6} transform="rotate(26 327 32)" />
        <ellipse cx={315} cy={62} rx={6} ry={3.2} transform="rotate(-22 315 62)" />
      </g>
      {/* rope bridge across the gorge */}
      <g>
        <rect x={20} y={82} width={9} height={34} rx={4.5} fill="#A9805A" />
        <rect x={331} y={78} width={9} height={34} rx={4.5} fill="#A9805A" />
        <path d="M 26 84 Q 180 128 334 80" fill="none" stroke="#A9805A" strokeWidth={2.6} strokeLinecap="round" />
        <g stroke="#A9805A" strokeWidth={1.8} strokeLinecap="round">
          <path d="M 72 95 L 72 118" />
          <path d="M 118 102 L 118 125" />
          <path d="M 180 105 L 180 128" />
          <path d="M 242 101 L 242 123" />
          <path d="M 288 92 L 288 115" />
        </g>
        <path d="M 26 106 Q 180 152 334 102" fill="none" stroke="#A9805A" strokeWidth={9} strokeLinecap="round" opacity={0.55} />
        <path d="M 26 106 Q 180 152 334 102" fill="none" stroke="#D8BC96" strokeWidth={7} strokeDasharray="7 4" />
      </g>
      {/* gorge floor + foreground leaves */}
      <path d="M 0 168 Q 90 156 180 164 Q 270 172 360 160 L 360 200 L 0 200 Z" fill="#8CC7A6" />
      <g fill="#63B389">
        <ellipse cx={16} cy={182} rx={34} ry={16} transform="rotate(-18 16 182)" />
        <ellipse cx={52} cy={197} rx={30} ry={13} transform="rotate(10 52 197)" />
        <ellipse cx={344} cy={180} rx={34} ry={16} transform="rotate(16 344 180)" />
        <ellipse cx={308} cy={196} rx={28} ry={12} transform="rotate(-12 308 196)" />
      </g>
      {/* butterflies */}
      <Butterfly x={98} y={92} fill="#F9A8D4" edge="#E98598" delay={0.2} />
      <Butterfly x={252} y={78} fill="#C4B5FD" edge="#9F8AD9" s={0.85} delay={1.1} />
      <Butterfly x={88} y={148} fill="#FBBF24" edge="#D9A93C" s={0.75} delay={2.1} />
      <Butterfly x={296} y={150} fill="#86EFAC" edge="#5FBF84" s={0.7} delay={1.6} />
    </g>
  );
}

/** 2 — finále: summit at sunset, flag, half-open treasure chest, celebration sparks. */
function Finale() {
  return (
    <g>
      <rect width={360} height={200} fill="url(#bubsc-dobrodruzstvi-sunset)" />
      {/* low sun */}
      <circle cx={252} cy={94} r={44} fill="url(#bubsc-dobrodruzstvi-glow)" className="bubsc-dobrodruzstvi-glow" />
      <circle cx={252} cy={94} r={21} fill="#FDE68A" />
      {/* mountain ranges */}
      <path d="M 0 122 Q 40 88 78 118 Q 112 82 150 120 Q 196 86 236 118 Q 282 84 320 116 Q 344 100 360 118 L 360 200 L 0 200 Z" fill="#C6B4E6" opacity={0.8} />
      <path d="M 0 142 Q 54 110 104 140 Q 158 110 210 142 Q 268 114 316 144 Q 340 132 360 142 L 360 200 L 0 200 Z" fill="#AE99D8" opacity={0.92} />
      {/* hero summit with a sunlit cap */}
      <path d="M 18 200 Q 52 156 88 120 Q 104 100 120 120 Q 152 156 186 200 Z" fill="#9F8AC4" />
      <path d="M 88 120 Q 104 100 120 120 Q 128 132 133 140 Q 106 128 82 141 Q 85 130 88 120 Z" fill="#DACDEF" opacity={0.85} />
      {/* flag on the peak */}
      <rect x={102} y={54} width={4.5} height={58} rx={2.2} fill="#A9805A" />
      <path d="M 106 58 Q 126 64 143 59 Q 133 70 143 81 Q 124 77 106 82 Z" fill="#FDA4AF" stroke="#E98598" strokeWidth={2} strokeLinejoin="round" />
      {/* right ledge with the treasure chest */}
      <path d="M 214 200 Q 246 176 288 167 Q 330 158 360 170 L 360 200 Z" fill="#8E77B4" />
      <g>
        <circle cx={300} cy={144} r={46} fill="url(#bubsc-dobrodruzstvi-glow)" className="bubsc-dobrodruzstvi-glow" />
        <path d="M 282 140 L 270 100 L 332 100 L 318 140 Z" fill="url(#bubsc-dobrodruzstvi-beam)" opacity={0.7} />
        <g transform="rotate(-16 276 142)">
          <path d="M 274 142 L 274 132 Q 300 116 326 132 L 326 142 Z" fill="#DCBB92" stroke="#A9805A" strokeWidth={2.4} strokeLinejoin="round" />
          <rect x={296} y={126} width={8} height={16} rx={3} fill="#FBBF24" stroke="#D9A93C" strokeWidth={1.4} />
        </g>
        <rect x={274} y={142} width={52} height={26} rx={6} fill="#CBA37A" stroke="#A9805A" strokeWidth={2.4} />
        <rect x={274} y={150} width={52} height={5} fill="#FBBF24" opacity={0.9} />
        <rect x={296} y={150} width={8} height={12} rx={3} fill="#FBBF24" stroke="#D9A93C" strokeWidth={1.4} />
        {/* coins spilling out */}
        <circle cx={268} cy={166} r={4} fill="#FBBF24" stroke="#D9A93C" strokeWidth={1.2} />
        <circle cx={334} cy={168} r={3.4} fill="#FBBF24" stroke="#D9A93C" strokeWidth={1.2} />
      </g>
      {/* celebration sparks */}
      <Spark cx={60} cy={40} r={7} delay={0.2} />
      <Spark cx={158} cy={34} r={5} fill="#F9A8D4" delay={1} />
      <Spark cx={196} cy={62} r={4} fill="#C4B5FD" delay={1.9} />
      <Spark cx={318} cy={48} r={6} fill="#86EFAC" delay={0.7} />
      <Spark cx={300} cy={118} r={5} delay={1.4} />
      <Spark cx={40} cy={92} r={4} fill="#FDA4AF" delay={2.3} />
      <g opacity={0.85}>
        <circle cx={62} cy={122} r={2.4} fill="#86EFAC" className="bubsc-dobrodruzstvi-fly" />
        <circle cx={226} cy={44} r={2.2} fill="#F9A8D4" className="bubsc-dobrodruzstvi-fly" style={{ animationDelay: '1.3s' }} />
        <circle cx={344} cy={86} r={2.6} fill="#C4B5FD" className="bubsc-dobrodruzstvi-fly" style={{ animationDelay: '2.2s' }} />
      </g>
    </g>
  );
}

export function DobrodruzstviScene({ variant }: StorySceneProps) {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMax slice" className="bubsc-dobrodruzstvi" role="presentation">
      <style>{CSS}</style>
      <Defs />
      {variant <= 0 ? <Setkani /> : variant === 1 ? <Hloubka /> : <Finale />}
    </svg>
  );
}
