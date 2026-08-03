import type { ReactNode } from 'react';

// Pet room scene parts — cozy hand-drawn furniture, sky states and unlockable decorations.
// Coordinate space: viewBox "0 0 360 300". Wall spans y 0–210, floor y 210–300.
// Same drawing rules as the avatar rig: rounded shapes, no black outlines,
// contours are a darker tint of the fill.

export type TimeOfDay = 'day' | 'dusk' | 'night';

/** Shared anchors so decorations land exactly on the furniture they belong to. */
export const ROOM = {
  width: 360,
  height: 300,
  floorY: 210,
  /** window glass (inner pane) */
  glass: { x: 40, y: 56, w: 98, h: 82, r: 10 },
  /** top of the window sill — the plant pot stands here */
  sillY: 146,
  /** top of the wall shelf plank — the lamp stands here */
  shelfY: 150,
  /** lamp globe centre */
  lamp: { cx: 287, cy: 126, r: 15 },
} as const;

/** Five-pointed star as a closed path — used for wallpaper, sky and the garland. */
export function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.44;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

// ————————————————————————————————— defs —————————————————————————————————

/** Gradients, wallpaper pattern and the glass clip. Ids are namespaced per instance. */
export function RoomDefs({ uid, phase }: { uid: string; phase: TimeOfDay }) {
  return (
    <defs>
      <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF3F8" />
        <stop offset="100%" stopColor="#FBE1EE" />
      </linearGradient>

      <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F7DFC7" />
        <stop offset="100%" stopColor="#EBC49F" />
      </linearGradient>

      <pattern id={`${uid}-dots`} width={38} height={38} patternUnits="userSpaceOnUse">
        <circle cx={9} cy={10} r={2.8} fill="#F9A8D4" />
        <path d={starPath(27, 27, 4.6)} fill="#C4B5FD" />
      </pattern>

      {phase === 'day' && (
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A9DDF7" />
          <stop offset="100%" stopColor="#E7F6FF" />
        </linearGradient>
      )}
      {phase === 'dusk' && (
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="55%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#FEE3C6" />
        </linearGradient>
      )}
      {phase === 'night' && (
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E2A4F" />
          <stop offset="100%" stopColor="#463F6E" />
        </linearGradient>
      )}

      <radialGradient id={`${uid}-glow`}>
        <stop offset="0%" stopColor="#FBBF24" stopOpacity={1} />
        <stop offset="55%" stopColor="#FBBF24" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
      </radialGradient>

      <clipPath id={`${uid}-glass`}>
        <rect x={ROOM.glass.x} y={ROOM.glass.y} width={ROOM.glass.w} height={ROOM.glass.h} rx={ROOM.glass.r} />
      </clipPath>
    </defs>
  );
}

// ———————————————————————————————— shell ————————————————————————————————

/** Back wall with a soft wallpaper pattern. */
export function Wall({ uid }: { uid: string }) {
  return (
    <g>
      <rect x={0} y={0} width={ROOM.width} height={ROOM.floorY + 4} fill={`url(#${uid}-wall)`} />
      <rect x={0} y={0} width={ROOM.width} height={ROOM.floorY + 4} fill={`url(#${uid}-dots)`} opacity={0.15} />
    </g>
  );
}

/** Warm pastel wooden floor with a skirting board. */
export function Floor({ uid }: { uid: string }) {
  return (
    <g>
      <rect x={0} y={ROOM.floorY} width={ROOM.width} height={ROOM.height - ROOM.floorY} fill={`url(#${uid}-floor)`} />
      <g stroke="#D9AC83" strokeWidth={1.6} strokeLinecap="round" opacity={0.32}>
        <path d="M 0 234 H 360" />
        <path d="M 0 260 H 360" />
        <path d="M 0 288 H 360" />
        <path d="M 108 212 V 234" />
        <path d="M 286 234 V 260" />
        <path d="M 62 260 V 288" />
      </g>
      {/* skirting board */}
      <rect x={0} y={ROOM.floorY - 9} width={ROOM.width} height={12} rx={5} fill="#FFF8FB" />
      <path d={`M 0 ${ROOM.floorY + 2} H 360`} stroke="#E6C9D8" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Window frame, sill and mullions. The sky lives behind them. */
export function WindowFrame({ children }: { children: ReactNode }) {
  return (
    <g>
      <rect x={30} y={46} width={118} height={102} rx={16} fill="#FFFDFB" stroke="#D9B9C8" strokeWidth={3.5} />
      {children}
      <g stroke="#FFFDFB" strokeWidth={6} strokeLinecap="round">
        <path d="M 89 56 V 138" />
        <path d="M 40 97 H 138" />
      </g>
      <rect
        x={ROOM.glass.x} y={ROOM.glass.y} width={ROOM.glass.w} height={ROOM.glass.h} rx={ROOM.glass.r}
        fill="none" stroke="#E3C6D3" strokeWidth={2.5}
      />
      {/* sill */}
      <rect x={22} y={ROOM.sillY} width={134} height={14} rx={7} fill="#F7E2D0" stroke="#DCBBA0" strokeWidth={2.5} />
    </g>
  );
}

/** What you can see outside — changes with the time of day. */
export function SkyView({ uid, phase }: { uid: string; phase: TimeOfDay }) {
  const hill = phase === 'night' ? '#3F3968' : phase === 'dusk' ? '#E08FA8' : '#86EFAC';
  const hillBack = phase === 'night' ? '#4B4480' : phase === 'dusk' ? '#F0A9B8' : '#A7F3C6';

  return (
    <g clipPath={`url(#${uid}-glass)`}>
      <rect x={ROOM.glass.x} y={ROOM.glass.y} width={ROOM.glass.w} height={ROOM.glass.h} fill={`url(#${uid}-sky)`} />

      {phase === 'day' && (
        <g>
          <circle cx={118} cy={72} r={19} fill="#FDE68A" opacity={0.35} />
          <circle cx={118} cy={72} r={12} fill="#FBBF24" />
          <g className="bub-cloud">
            <g fill="#FFFFFF" opacity={0.92}>
              <ellipse cx={66} cy={82} rx={17} ry={10} />
              <circle cx={57} cy={78} r={9} />
              <circle cx={72} cy={75} r={11} />
            </g>
          </g>
        </g>
      )}

      {phase === 'dusk' && (
        <g>
          <circle cx={66} cy={116} r={22} fill="#FDE68A" opacity={0.3} />
          <circle cx={66} cy={116} r={13} fill="#FDE68A" />
          <g className="bub-cloud">
            <g fill="#FFE6DA" opacity={0.85}>
              <ellipse cx={108} cy={76} rx={16} ry={8} />
              <circle cx={101} cy={72} r={8} />
              <circle cx={114} cy={70} r={9.5} />
            </g>
          </g>
        </g>
      )}

      {phase === 'night' && (
        <g>
          <circle cx={114} cy={74} r={22} fill="#FDE68A" opacity={0.07} />
          <circle cx={114} cy={74} r={16} fill="#FDE68A" opacity={0.12} />
          <circle cx={114} cy={74} r={12} fill="#FDE68A" />
          <g fill="#FCD34D" opacity={0.5}>
            <circle cx={110} cy={70} r={3} />
            <circle cx={118} cy={79} r={2.2} />
          </g>
          <g fill="#FFF9E6">
            {[
              { cx: 55, cy: 68, r: 2.2 },
              { cx: 74, cy: 60, r: 1.6 },
              { cx: 62, cy: 88, r: 1.8 },
              { cx: 48, cy: 104, r: 2.1 },
              { cx: 80, cy: 112, r: 1.5 },
              { cx: 100, cy: 96, r: 1.9 },
              { cx: 126, cy: 104, r: 1.6 },
              { cx: 92, cy: 66, r: 1.4 },
            ].map((s, i) => (
              <circle
                key={`${s.cx}-${s.cy}`}
                cx={s.cx} cy={s.cy} r={s.r}
                className="bub-twinkle"
                style={{ animationDelay: `${(i * 0.43).toFixed(2)}s` }}
              />
            ))}
          </g>
          <path d={starPath(70, 92, 4.4)} fill="#FFF9E6" className="bub-twinkle" style={{ animationDelay: '1.1s' }} />
        </g>
      )}

      {/* horizon */}
      <path d="M 40 138 L 40 122 Q 66 106 92 120 Q 116 132 138 116 L 138 138 Z" fill={hillBack} opacity={0.75} />
      <path d="M 40 138 L 40 130 Q 70 118 100 130 Q 120 138 138 128 L 138 138 Z" fill={hill} />
    </g>
  );
}

/** Wall shelf — plank plus two little brackets. */
export function Shelf() {
  return (
    <g>
      <rect x={236} y={ROOM.shelfY} width={106} height={11} rx={5} fill="#F0D2B4" stroke="#D3A87F" strokeWidth={2.5} />
      <g fill="#E0BC97" stroke="#D3A87F" strokeWidth={2}>
        <rect x={250} y={160} width={10} height={11} rx={3} />
        <rect x={318} y={160} width={10} height={11} rx={3} />
      </g>
    </g>
  );
}

/** Plush floor cushion the pet snuggles into. */
export function Pouf() {
  return (
    <g>
      <ellipse cx={180} cy={259} rx={60} ry={12} fill="#D8A882" opacity={0.26} />
      <ellipse cx={180} cy={252} rx={58} ry={19} fill="#F08A99" />
      <ellipse cx={180} cy={246} rx={58} ry={18} fill="#FDA4AF" stroke="#EC8496" strokeWidth={3} />
      <ellipse cx={180} cy={244} rx={37} ry={10} fill="#FEC5CC" opacity={0.85} />
      <ellipse
        cx={180} cy={246} rx={48} ry={12}
        fill="none" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="5 8" strokeLinecap="round" opacity={0.5}
      />
    </g>
  );
}

/** Gentle night tint over the whole room — keeps it friendly, never gloomy. */
export function NightTint() {
  return <rect x={0} y={0} width={ROOM.width} height={ROOM.height} fill="rgba(46, 42, 79, 0.18)" />;
}

// ———————————————————————— decorations (unlockable) ————————————————————————

/** deco_plant — a little flower in a pot on the window sill. */
export function SillPlant() {
  const potTop = ROOM.sillY - 22;
  return (
    <g>
      <path
        d={`M 120 ${potTop} H 150 L 146 ${ROOM.sillY} H 124 Z`}
        fill="#FDA4AF" stroke="#E98894" strokeWidth={2.5} strokeLinejoin="round"
      />
      <rect x={117} y={potTop - 6} width={36} height={8} rx={4} fill="#FEC5CC" stroke="#E98894" strokeWidth={2.2} />
      <path d={`M 135 ${potTop - 6} C 135 112 133 104 134 98`} stroke="#86EFAC" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <ellipse cx={124} cy={112} rx={9} ry={5.5} fill="#86EFAC" stroke="#5FCB86" strokeWidth={2} transform="rotate(-22 124 112)" />
      <ellipse cx={144} cy={105} rx={8} ry={5} fill="#A7F3C6" stroke="#5FCB86" strokeWidth={2} transform="rotate(20 144 105)" />
      <g fill="#F9A8D4" stroke="#E687BA" strokeWidth={2}>
        {[0, 1, 2, 3, 4].map(i => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return <circle key={i} cx={134 + 8.5 * Math.cos(a)} cy={95 + 8.5 * Math.sin(a)} r={6} />;
        })}
      </g>
      <circle cx={134} cy={95} r={5} fill="#FBBF24" stroke="#E9A21A" strokeWidth={1.8} />
    </g>
  );
}

/** deco_lamp — round little lamp standing on the shelf. */
export function ShelfLamp() {
  const { cx, cy, r } = ROOM.lamp;
  return (
    <g>
      <rect x={cx - 9} y={ROOM.shelfY - 10} width={18} height={11} rx={4} fill="#C4B5FD" stroke="#A18DF0" strokeWidth={2.4} />
      <circle cx={cx} cy={cy} r={r} fill="#FDE68A" stroke="#EBBE55" strokeWidth={2.8} />
      <path
        d={`M ${cx - 9} ${cy - 4} Q ${cx - 6} ${cy - 11} ${cx + 1} ${cy - 12}`}
        stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7}
      />
    </g>
  );
}

/** Warm halo around the lamp — only after dark. */
export function LampGlow({ uid }: { uid: string }) {
  const { cx, cy } = ROOM.lamp;
  return (
    <g className="bub-glow">
      <circle cx={cx} cy={cy} r={58} fill={`url(#${uid}-glow)`} opacity={0.25} />
    </g>
  );
}

/** deco_poster — framed rainbow picture on the wall. */
export function WallPoster({ uid }: { uid: string }) {
  return (
    <g>
      <rect x={178} y={52} width={78} height={66} rx={8} fill="#C4B5FD" />
      <rect x={183} y={57} width={68} height={56} rx={5} fill="#FFFDFB" />
      <clipPath id={`${uid}-poster`}>
        <rect x={183} y={57} width={68} height={56} rx={5} />
      </clipPath>
      <g clipPath={`url(#${uid}-poster)`} fill="none" strokeWidth={6.5} strokeLinecap="round">
        <path d="M 191 113 A 26 26 0 0 1 243 113" stroke="#FDA4AF" />
        <path d="M 197.5 113 A 19.5 19.5 0 0 1 236.5 113" stroke="#FBBF24" />
        <path d="M 204 113 A 13 13 0 0 1 230 113" stroke="#86EFAC" />
        <g fill="#FFFFFF" stroke="none">
          <ellipse cx={192} cy={112} rx={12} ry={7} />
          <ellipse cx={242} cy={112} rx={12} ry={7} />
        </g>
      </g>
      <rect x={178} y={52} width={78} height={66} rx={8} fill="none" stroke="#A18DF0" strokeWidth={3} />
    </g>
  );
}

/** deco_rug — soft oval rug under the pet. */
export function FloorRug() {
  return (
    <g>
      <ellipse cx={180} cy={264} rx={96} ry={28} fill="#C4B5FD" stroke="#A18DF0" strokeWidth={3} />
      <ellipse cx={180} cy={264} rx={76} ry={21} fill="#DED4FF" />
      <ellipse
        cx={180} cy={264} rx={57} ry={14}
        fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="7 9" strokeLinecap="round" opacity={0.75}
      />
      <ellipse cx={180} cy={264} rx={36} ry={8} fill="#F1ECFF" />
    </g>
  );
}

/** deco_stars — garland of glow-in-the-dark stars strung under the ceiling. */
export function StarGarland({ phase }: { phase: TimeOfDay }) {
  const night = phase === 'night';
  const stars: { x: number; y: number }[] = [
    { x: 51, y: 33 }, { x: 105, y: 41 }, { x: 160, y: 45 },
    { x: 214, y: 44 }, { x: 268, y: 39 }, { x: 316, y: 32 },
  ];
  return (
    <g>
      <path
        d="M 10 24 Q 180 66 350 24"
        fill="none" stroke={night ? '#8F86C4' : '#D9B9C8'} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}
      />
      {stars.map((s, i) => (
        <g key={`${s.x}-${s.y}`} className="bub-garland" style={{ animationDelay: `${(i * 0.5).toFixed(2)}s` }}>
          {night && <circle cx={s.x} cy={s.y + 9} r={14} fill="#FBBF24" opacity={0.22} />}
          <path
            d={starPath(s.x, s.y + 9, 8)}
            fill={night ? '#FDE68A' : '#FEF3C7'}
            stroke={night ? '#F6C453' : '#EBD9A8'}
            strokeWidth={2.2}
            strokeLinejoin="round"
            opacity={night ? 1 : 0.75}
          />
        </g>
      ))}
    </g>
  );
}
