// Soap bubbles drifting up behind the login screen. Pure CSS, so it costs
// nothing on the JS thread and stops under prefers-reduced-motion.

const BUBBLES = [
  { left: '8%', size: 34, delay: 0, duration: 14 },
  { left: '22%', size: 18, delay: 4, duration: 11 },
  { left: '38%', size: 46, delay: 8, duration: 17 },
  { left: '55%', size: 22, delay: 2, duration: 12 },
  { left: '70%', size: 38, delay: 6, duration: 15 },
  { left: '84%', size: 16, delay: 10, duration: 10 },
  { left: '92%', size: 28, delay: 1, duration: 13 },
];

export function FloatingBubbles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble-rise absolute rounded-full"
          style={{
            left: b.left,
            bottom: -b.size,
            width: b.size,
            height: b.size,
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(249,168,212,0.25) 45%, rgba(196,181,253,0.2) 70%, transparent 72%)',
            border: '1px solid rgba(196,181,253,0.35)',
            animation: `bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
