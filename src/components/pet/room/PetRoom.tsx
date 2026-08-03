'use client';

// PetRoom — the cozy little room the pet lives in.
// Layer order (bottom → top):
//   wall → window (sky, frame, plant) → poster → shelf + lamp → floor →
//   rug → pouf → night tint → lamp glow → star garland → [children overlay]
//
// The scene is a full-bleed SVG background; `children` (the PetAvatar) is
// positioned as an absolute overlay standing on the cushion.

import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  ROOM, RoomDefs, Wall, Floor, WindowFrame, SkyView, Shelf, Pouf, NightTint,
  SillPlant, ShelfLamp, LampGlow, WallPoster, FloorRug, StarGarland,
  type TimeOfDay,
} from './parts';

const ROOM_CSS = `
.bub-room { display: block; }
.bub-room .bub-cloud { transform-box: view-box; animation: bub-room-cloud 16s ease-in-out infinite; }
.bub-room .bub-twinkle { animation: bub-room-twinkle 3.6s ease-in-out infinite; }
.bub-room .bub-glow { transform-box: fill-box; transform-origin: center; animation: bub-room-glow 5.4s ease-in-out infinite; }
.bub-room .bub-garland { transform-box: fill-box; transform-origin: center; animation: bub-room-bob 6.5s ease-in-out infinite; }
@keyframes bub-room-cloud { 0%, 100% { transform: translateX(-6px); } 50% { transform: translateX(10px); } }
@keyframes bub-room-twinkle { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
@keyframes bub-room-glow { 0%, 100% { opacity: 0.8; transform: scale(0.94); } 50% { opacity: 1; transform: scale(1.06); } }
@keyframes bub-room-bob { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-2.5px) rotate(3deg); } }
@media (prefers-reduced-motion: reduce) { .bub-room * { animation: none !important; } }
`;

const PHASE_LABEL: Record<TimeOfDay, string> = {
  day: 'Pokojíček Bublíka za bílého dne',
  dusk: 'Pokojíček Bublíka za podvečerního světla',
  night: 'Pokojíček Bublíka v noci',
};

/** day 7–18, dusk 5–7 and 18–21, night 21–5 */
function phaseForHour(hour: number): TimeOfDay {
  if (hour >= 7 && hour < 18) return 'day';
  if ((hour >= 5 && hour < 7) || (hour >= 18 && hour < 21)) return 'dusk';
  return 'night';
}

export interface PetRoomProps {
  /** roomSlot → item id (or null when the slot is empty) */
  placed: Record<string, string | null>;
  /** the pet avatar, rendered as an overlay in front of the scene */
  children?: ReactNode;
  className?: string;
}

export function PetRoom({ placed, children, className = '' }: PetRoomProps) {
  // useId keeps gradient/pattern ids unique when several rooms share a page.
  const uid = `bubroom${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // Start on 'day' so server and first client render match, then follow the clock.
  const [phase, setPhase] = useState<TimeOfDay>('day');

  useEffect(() => {
    const sync = () => setPhase(phaseForHour(new Date().getHours()));
    sync();
    const timer = window.setInterval(sync, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const night = phase === 'night';

  // Each room slot currently holds exactly one catalog item — match on the id so
  // a future decoration never renders as the wrong thing.
  const hasPlant = placed.window === 'deco_plant';
  const hasLamp = placed.shelf === 'deco_lamp';
  const hasPoster = placed.wall === 'deco_poster';
  const hasRug = placed.floor === 'deco_rug';
  const hasStars = placed.ceiling === 'deco_stars';

  return (
    <div
      className={`relative w-full overflow-hidden aspect-[6/5] ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <svg
        viewBox={`0 0 ${ROOM.width} ${ROOM.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax slice"
        className="bub-room"
        role="img"
        aria-label={PHASE_LABEL[phase]}
      >
        <style>{ROOM_CSS}</style>
        <RoomDefs uid={uid} phase={phase} />

        <Wall uid={uid} />

        <WindowFrame>
          <SkyView uid={uid} phase={phase} />
        </WindowFrame>
        {hasPlant && <SillPlant />}

        {hasPoster && <WallPoster uid={uid} />}

        <Shelf />
        {hasLamp && <ShelfLamp />}

        <Floor uid={uid} />
        {hasRug && <FloorRug />}
        <Pouf />

        {night && <NightTint />}
        {night && hasLamp && <LampGlow uid={uid} />}
        {hasStars && <StarGarland phase={phase} />}
      </svg>

      <div
        className="absolute pointer-events-none"
        style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>
  );
}
