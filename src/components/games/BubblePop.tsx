'use client';

// BubblePop — canvas playground where bubbles rise and get popped by tapping.
// Two modes: a 60 s scored round, and an untimed "calm" mode (no score, no rewards).
// There is no fail state and no penalty — a tap that hits nothing only ends the
// current streak, nothing is ever taken away.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import type { PetState, PetSpecies } from '@/lib/pet-engine';
import { hapticSuccess, hapticTap } from '@/lib/haptics';

export type BubbleMode = 'timed' | 'calm';

/** length of a scored round in seconds */
export const ROUND_SECONDS = 60;
/** score that maps to a full 1.0 round rating for the reward contract */
export const SCORE_TARGET = 220;

interface BubblePopProps {
  mode: BubbleMode;
  pet: PetState | null;
  /** timed mode only — fired exactly once when the clock runs out */
  onFinish?: (score: number) => void;
}

/* ------------------------------------------------------------------ model */

type BubbleKind = 'normal' | 'star' | 'comet' | 'giant' | 'joker';

interface Palette {
  fill: string;
  dark: string;
}

// Brand palette — hex is allowed here because this is canvas graphics.
const PALETTES: Palette[] = [
  { fill: '#F9A8D4', dark: '#DB6FA6' },
  { fill: '#C4B5FD', dark: '#8B79E8' },
  { fill: '#86EFAC', dark: '#43C97C' },
  { fill: '#FDA4AF', dark: '#EC6D80' },
];
const GOLD: Palette = { fill: '#FBBF24', dark: '#C98A06' };
const SOAP: Palette = { fill: '#C4B5FD', dark: '#9B8BF2' };
const RAINBOW = ['#F9A8D4', '#FDA4AF', '#FBBF24', '#86EFAC', '#C4B5FD', '#F472B6'];

const POINTS: Record<BubbleKind, number> = {
  normal: 1,
  star: 5,
  comet: 10,
  giant: 3,
  joker: 20,
};

interface Bubble {
  kind: BubbleKind;
  /** wobble centre — the drawn x oscillates around it */
  x: number;
  y: number;
  r: number;
  /** rise speed in px/s */
  vy: number;
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
  pal: Palette;
  age: number;
}

/** short-lived squash & stretch ring left behind by a popped bubble */
interface Pop {
  x: number;
  y: number;
  r: number;
  pal: Palette;
  t: number;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  color: string;
}

const MAX_PARTICLES = 60;
const MAX_BUBBLES_TIMED = 16;
const MAX_BUBBLES_CALM = 8;
const POP_DURATION = 0.22;
const POPUP_DURATION = 0.75;
const SHAKE_DURATION = 0.12;
const SHAKE_PX = 3;
const RAINBOW_DURATION = 0.55;
const STREAK_FOR_JOKER = 5;
/** extra forgiveness around the visual edge, in px */
const HIT_SLOP = 10;

/* ---------------------------------------------------------------- drawing */

function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number): void {
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** glassy body shared by every bubble kind */
function drawShell(ctx: CanvasRenderingContext2D, r: number, pal: Palette, lineWidth: number): void {
  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.08, 0, 0, r);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.42, withAlpha(pal.fill, 0.45));
  grad.addColorStop(1, withAlpha(pal.fill, 0.92));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = pal.dark;
  ctx.stroke();
}

/** the highlight that makes a circle read as a bubble */
function drawShine(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, -r * 0.38, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(-r * 0.08, -r * 0.55, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawBubble(ctx: CanvasRenderingContext2D, b: Bubble): void {
  const drawX = b.x + Math.sin(b.age * b.wobbleFreq + b.phase) * b.wobbleAmp;

  // spawn pop-in with a little overshoot, plus a slow idle breathing squash
  const grow = Math.min(1, b.age / 0.26);
  const overshoot = 1 + Math.sin(grow * Math.PI) * 0.18;
  const breathe = Math.sin(b.age * 2.2 + b.phase) * 0.035;
  const sx = grow * overshoot * (1 + breathe);
  const sy = grow * overshoot * (1 - breathe);
  const r = b.r;

  ctx.save();
  ctx.translate(drawX, b.y);
  ctx.scale(sx, sy);

  if (b.kind === 'comet') {
    // trailing tail below — the comet rises, so the tail hangs down
    const tail = ctx.createLinearGradient(0, 0, 0, r * 3.4);
    tail.addColorStop(0, withAlpha(GOLD.fill, 0.6));
    tail.addColorStop(1, withAlpha(GOLD.fill, 0));
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, r * 0.2);
    ctx.quadraticCurveTo(0, r * 3.6, r * 0.62, r * 0.2);
    ctx.closePath();
    ctx.fillStyle = tail;
    ctx.fill();
  }

  if (b.kind === 'joker') {
    // rainbow wedges — unmistakably different from every other bubble
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    const step = (Math.PI * 2) / RAINBOW.length;
    for (let i = 0; i < RAINBOW.length; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * step - Math.PI / 2, (i + 1) * step - Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = withAlpha(RAINBOW[i], 0.62);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = b.pal.dark;
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
    ctx.stroke();
    starPath(ctx, 0, 0, r * 0.46, r * 0.2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    ctx.restore();
    return;
  }

  if (b.kind === 'giant') {
    // soap-film look: near-transparent shell with iridescent swirls inside
    drawShell(ctx, r, SOAP, 4);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
    ctx.clip();
    const swirls: Array<[string, number, number, number]> = [
      ['#F9A8D4', 0.72, -2.5, -0.6],
      ['#86EFAC', 0.55, 0.2, 2.1],
      ['#FBBF24', 0.86, 1.6, 3.2],
    ];
    for (const [color, radiusRatio, from, to] of swirls) {
      ctx.beginPath();
      ctx.arc(0, 0, r * radiusRatio, from, to);
      ctx.strokeStyle = withAlpha(color, 0.5);
      ctx.lineWidth = r * 0.1;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
    drawShine(ctx, r);
    ctx.restore();
    return;
  }

  drawShell(ctx, r, b.kind === 'comet' ? GOLD : b.pal, b.kind === 'star' ? 3.5 : 3);

  if (b.kind === 'star') {
    starPath(ctx, 0, r * 0.03, r * 0.54, r * 0.24);
    ctx.fillStyle = withAlpha(b.pal.dark, 0.88);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();
  }

  if (b.kind === 'comet') {
    // a bright core so the golden one reads even at a glance
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha('#FFFFFF', 0.6);
    ctx.fill();
    starPath(ctx, 0, 0, r * 0.34, r * 0.14);
    ctx.fillStyle = GOLD.dark;
    ctx.fill();
  }

  drawShine(ctx, r);
  ctx.restore();
}

function drawPop(ctx: CanvasRenderingContext2D, p: Pop): void {
  const t = Math.min(1, p.t / POP_DURATION);
  const ease = 1 - (1 - t) * (1 - t);
  const radius = p.r * (1 + ease * 0.65);
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = p.pal.dark;
  ctx.lineWidth = 3.5 * (1 - t) + 1;
  ctx.beginPath();
  // squash & stretch: the ring flattens as it expands outward
  ctx.ellipse(p.x, p.y, radius * (1 + ease * 0.28), radius * (1 - ease * 0.34), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* -------------------------------------------------------------- component */

export function BubblePop({ mode, pet, onFinish }: BubblePopProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishRef = useRef(onFinish);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [cheer, setCheer] = useState<string | null>(
    mode === 'calm' ? 'Klídek… jen bublinky. 🫧' : 'Jdeme na to! 🫧',
  );

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timed = mode === 'timed';
    const size = { w: wrap.clientWidth, h: wrap.clientHeight };

    const bubbles: Bubble[] = [];
    const pops: Pop[] = [];
    const popups: Popup[] = [];
    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({ x: 0, y: 0, vx: 0, vy: 0, r: 0, life: 0, max: 1, color: '#FFFFFF' });
    }
    let particleCursor = 0;

    let scoreValue = 0;
    let streakValue = 0;
    let nextMilestone = 0;
    let elapsed = 0;
    let spawnIn = 0.35;
    let shake = 0;
    let rainbow = 0;
    let jokerAlive = false;
    let ended = false;
    let shownSecond = ROUND_SECONDS;
    let raf = 0;
    let cheerTimer = 0;

    const MILESTONES = [25, 50, 100, 150, 200];

    /* ---------------------------------------------------------- helpers */

    const say = (text: string, holdMs = 1800): void => {
      setCheer(text);
      window.clearTimeout(cheerTimer);
      cheerTimer = window.setTimeout(() => setCheer(null), holdMs);
    };

    const setupCanvas = (): void => {
      size.w = wrap.clientWidth;
      size.h = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.max(1, Math.round(size.w * dpr));
      canvas.height = Math.max(1, Math.round(size.h * dpr));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    };

    const emit = (x: number, y: number, color: string, count: number): void => {
      for (let i = 0; i < count; i++) {
        // fixed-size pool — the oldest particle is recycled when it wraps around
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % MAX_PARTICLES;
        const angle = Math.random() * Math.PI * 2;
        const speed = 55 + Math.random() * 150;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 40;
        p.r = 2.5 + Math.random() * 3.5;
        p.max = 0.42 + Math.random() * 0.32;
        p.life = p.max;
        p.color = color;
      }
    };

    const makeBubble = (kind: BubbleKind, x: number, y: number, radius: number): Bubble => {
      const pal = kind === 'comet' ? GOLD : PALETTES[Math.floor(Math.random() * PALETTES.length)];
      const speeds: Record<BubbleKind, number> = {
        normal: 58 + Math.random() * 26,
        star: 102 + Math.random() * 26,
        comet: 168 + Math.random() * 24,
        giant: 30 + Math.random() * 10,
        joker: 72 + Math.random() * 14,
      };
      return {
        kind,
        x: Math.min(Math.max(x, radius + 6), Math.max(radius + 6, size.w - radius - 6)),
        y,
        r: radius,
        vy: timed ? speeds[kind] : speeds[kind] * 0.6,
        wobbleAmp: kind === 'giant' ? 12 : 6 + Math.random() * 9,
        wobbleFreq: 0.7 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        pal,
        age: 0,
      };
    };

    const rollKind = (): BubbleKind => {
      if (!timed) return Math.random() < 0.22 ? 'giant' : 'normal';
      const roll = Math.random();
      if (roll < 0.04) return 'comet';
      if (roll < 0.2) return 'star';
      if (roll < 0.3) return 'giant';
      return 'normal';
    };

    const radiusFor = (kind: BubbleKind): number => {
      // never below 34 px — a 68 px target clears the 60 pt minimum
      if (kind === 'giant') return 56 + Math.random() * 12;
      if (kind === 'joker') return 46;
      if (kind === 'comet') return 34 + Math.random() * 3;
      if (kind === 'star') return 34 + Math.random() * 5;
      return 34 + Math.random() * 9;
    };

    const spawn = (kind?: BubbleKind): void => {
      const k = kind ?? rollKind();
      const r = radiusFor(k);
      const x = r + 8 + Math.random() * Math.max(1, size.w - (r + 8) * 2);
      bubbles.push(makeBubble(k, x, size.h + r + 4, r));
    };

    const pop = (b: Bubble, index: number, drawX: number): void => {
      bubbles.splice(index, 1);
      if (b.kind === 'joker') jokerAlive = false;

      const pal = b.kind === 'comet' ? GOLD : b.kind === 'giant' ? SOAP : b.pal;
      pops.push({ x: drawX, y: b.y, r: b.r, pal, t: 0 });
      emit(drawX, b.y, pal.fill, b.kind === 'giant' ? 10 : 6 + Math.floor(Math.random() * 4));
      void hapticTap();

      // a giant soap bubble breaks into three small ones instead of vanishing
      if (b.kind === 'giant') {
        for (let i = 0; i < 3; i++) {
          const child = makeBubble('normal', drawX + (i - 1) * b.r * 0.6, b.y + (Math.random() - 0.5) * 14, 34);
          child.vy *= 1.15;
          bubbles.push(child);
        }
      }

      if (!timed) return;

      const gained = POINTS[b.kind];
      scoreValue += gained;
      streakValue += 1;
      setScore(scoreValue);
      setStreak(streakValue);
      popups.push({ x: drawX, y: b.y - b.r * 0.4, text: `+${gained}`, color: pal.dark, t: 0 });

      if (b.kind === 'comet') shake = SHAKE_DURATION;

      // a clean streak is rewarded with a bonus bubble, never demanded
      if (streakValue > 0 && streakValue % STREAK_FOR_JOKER === 0 && !jokerAlive) {
        jokerAlive = true;
        rainbow = RAINBOW_DURATION;
        spawn('joker');
        say('Duhová bublina! 🌈');
        void hapticSuccess();
      }

      while (nextMilestone < MILESTONES.length && scoreValue >= MILESTONES[nextMilestone]) {
        say(`Jupí! ${MILESTONES[nextMilestone]}!`);
        nextMilestone += 1;
      }
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (ended) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      // topmost bubble first — the last drawn is the one under the finger
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const drawX = b.x + Math.sin(b.age * b.wobbleFreq + b.phase) * b.wobbleAmp;
        const dx = px - drawX;
        const dy = py - b.y;
        if (dx * dx + dy * dy <= (b.r + HIT_SLOP) * (b.r + HIT_SLOP)) {
          pop(b, i, drawX);
          return;
        }
      }

      // a miss costs nothing but the streak
      if (timed && streakValue !== 0) {
        streakValue = 0;
        setStreak(0);
      }
    };

    /* ------------------------------------------------------------ loop */

    const update = (dt: number): void => {
      elapsed += dt;

      if (timed) {
        const left = Math.max(0, ROUND_SECONDS - elapsed);
        const whole = Math.ceil(left);
        if (whole !== shownSecond) {
          shownSecond = whole;
          setTimeLeft(whole);
        }
        if (left <= 0 && !ended) {
          ended = true;
          window.clearTimeout(cheerTimer);
          finishRef.current?.(scoreValue);
          return;
        }
      }

      spawnIn -= dt;
      const maxBubbles = timed ? MAX_BUBBLES_TIMED : MAX_BUBBLES_CALM;
      if (spawnIn <= 0 && bubbles.length < maxBubbles) {
        spawn();
        // gently busier as the round goes on — never faster than it stays fair
        const base = timed ? Math.max(0.4, 0.66 - elapsed * 0.004) : 1.45;
        spawnIn = base * (0.75 + Math.random() * 0.5);
      } else if (spawnIn <= 0) {
        spawnIn = 0.25;
      }

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += dt;
        b.y -= b.vy * dt;
        if (b.y < -b.r - 8) {
          if (b.kind === 'joker') jokerAlive = false;
          bubbles.splice(i, 1);
        }
      }

      for (let i = pops.length - 1; i >= 0; i--) {
        pops[i].t += dt;
        if (pops[i].t >= POP_DURATION) pops.splice(i, 1);
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        popups[i].t += dt;
        if (popups[i].t >= POPUP_DURATION) popups.splice(i, 1);
      }

      for (const p of particles) {
        if (p.life <= 0) continue;
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 240 * dt;
        p.vx *= 0.98;
      }

      if (shake > 0) shake = Math.max(0, shake - dt);
      if (rainbow > 0) rainbow = Math.max(0, rainbow - dt);
    };

    const draw = (): void => {
      ctx.clearRect(0, 0, size.w, size.h);
      ctx.save();

      if (shake > 0) {
        const amount = (shake / SHAKE_DURATION) * SHAKE_PX;
        ctx.translate((Math.random() * 2 - 1) * amount, (Math.random() * 2 - 1) * amount);
      }

      for (const b of bubbles) drawBubble(ctx, b);
      for (const p of pops) drawPop(ctx, p);

      for (const p of particles) {
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.lineJoin = 'round';
      for (const p of popups) {
        const t = p.t / POPUP_DURATION;
        ctx.globalAlpha = 1 - t * t;
        const y = p.y - t * 40;
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.strokeText(p.text, p.x, y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, y);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      if (rainbow > 0) {
        const t = rainbow / RAINBOW_DURATION;
        const grad = ctx.createLinearGradient(0, size.h, size.w, 0);
        for (let i = 0; i < RAINBOW.length; i++) {
          grad.addColorStop(i / (RAINBOW.length - 1), RAINBOW[i]);
        }
        ctx.globalAlpha = t * 0.3;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size.w, size.h);
        ctx.globalAlpha = 1;
      }
    };

    let last = performance.now();
    const frame = (now: number): void => {
      // delta cap keeps a backgrounded tab from teleporting every bubble
      const dt = Math.min(32, now - last) / 1000;
      last = now;
      update(dt);
      if (ended) return;
      draw();
      raf = requestAnimationFrame(frame);
    };

    setupCanvas();
    const observer = new ResizeObserver(setupCanvas);
    observer.observe(wrap);
    canvas.addEventListener('pointerdown', onPointerDown);
    // let the opening greeting fade on its own so it never sits over the bubbles
    cheerTimer = window.setTimeout(() => setCheer(null), 2400);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(cheerTimer);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mode]);

  const mood = streak >= STREAK_FOR_JOKER ? 'ecstatic' : 'happy';

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full rounded-3xl overflow-hidden select-none"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      />

      {/* pet cheers along — never in the way of a tap */}
      <div className="absolute left-3 top-3 flex items-start gap-2 pointer-events-none max-w-[70%]">
        {pet ? (
          <MiniPet
            species={pet.species as PetSpecies}
            stage={pet.stage}
            mood={mood}
            outfit={pet.activeOutfit}
            evolutionPath={pet.evolutionPath}
            size={56}
          />
        ) : (
          <span className="text-4xl leading-none">🫧</span>
        )}
        <AnimatePresence>
          {cheer && (
            <motion.p
              key={cheer}
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              className="mt-2 rounded-2xl rounded-bl-sm px-3 py-1.5 text-xs font-semibold leading-snug"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow)' }}
            >
              {cheer}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5 pointer-events-none">
        {mode === 'timed' ? (
          <>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold tabular-nums"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', boxShadow: 'var(--shadow)' }}
            >
              {timeLeft} s
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-bold tabular-nums"
              style={{ background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow)' }}
            >
              {score} b
            </span>
            {streak >= 3 && (
              <span
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                Série {streak}
              </span>
            )}
          </>
        ) : (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', boxShadow: 'var(--shadow)' }}
          >
            Klídek 🫧
          </span>
        )}
      </div>
    </div>
  );
}
