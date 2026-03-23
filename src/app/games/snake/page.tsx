'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStats } from '@/hooks/useStats';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, ArrowUp, ArrowDown, ArrowRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const GRID = 15;
const CELL_SIZE = 22;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

export default function SnakePage() {
  const { winGame } = useStats();
  const [snake, setSnake] = useState<Point[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Point>({ x: 3, y: 3 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const dirRef = useRef(direction);

  useEffect(() => {
    const saved = localStorage.getItem('bub_snake_best');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
    };
    if (opposites[newDir] !== dirRef.current) {
      setDirection(newDir);
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        changeDirection(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changeDirection]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const speed = Math.max(80, INITIAL_SPEED - score * 2);
    const interval = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };
        const dir = dirRef.current;

        if (dir === 'UP') head.y--;
        if (dir === 'DOWN') head.y++;
        if (dir === 'LEFT') head.x--;
        if (dir === 'RIGHT') head.x++;

        // Wall collision
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
          setGameOver(true);
          setIsPlaying(false);
          if (score > bestScore) {
            winGame();
            setBestScore(score);
            localStorage.setItem('bub_snake_best', String(score));
          }
          return prev;
        }

        // Self collision
        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          if (score > bestScore) {
            winGame();
            setBestScore(score);
            localStorage.setItem('bub_snake_best', String(score));
          }
          return prev;
        }

        const newSnake = [head, ...prev];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => s + 1);
          setFood(randomFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, food, score, bestScore]);

  const start = () => {
    setSnake([{ x: 7, y: 7 }]);
    setFood(randomFood([{ x: 7, y: 7 }]));
    setDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col items-center p-4 pb-24 safe-top">
        <div className="flex items-center gap-3 mb-4 self-start">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Had
          </h1>
          <div className="ml-auto flex gap-4">
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {score}
            </span>
            {bestScore > 0 && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Rekord: {bestScore}
              </span>
            )}
          </div>
        </div>

        {/* Board */}
        <div
          className="rounded-xl overflow-hidden relative"
          style={{
            width: GRID * CELL_SIZE,
            height: GRID * CELL_SIZE,
            background: 'var(--bg-secondary)',
            border: '2px solid var(--border)',
          }}
        >
          {/* Food */}
          <div
            className="absolute rounded-full"
            style={{
              left: food.x * CELL_SIZE + 2,
              top: food.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              background: 'var(--coral)',
            }}
          />
          {/* Snake */}
          {snake.map((segment, i) => (
            <div
              key={i}
              className="absolute rounded-md"
              style={{
                left: segment.x * CELL_SIZE + 1,
                top: segment.y * CELL_SIZE + 1,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                background: i === 0 ? 'var(--accent)' : 'var(--mint)',
                opacity: 1 - i * 0.03,
              }}
            />
          ))}

          {/* Start / Game Over overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
              <p className="text-white font-bold text-lg">
                {gameOver ? `💀 Skóre: ${score}` : '🐍'}
              </p>
              <button onClick={start} className="accent-button px-5 py-2 text-sm inline-flex items-center gap-2">
                <RotateCcw size={14} />
                {gameOver ? 'Znovu' : 'Hrát'}
              </button>
            </div>
          )}
        </div>

        {/* Touch controls */}
        {isPlaying && (
          <div className="mt-4 grid grid-cols-3 gap-2 w-36">
            <div />
            <button onClick={() => changeDirection('UP')} className="glass-card p-3 flex justify-center">
              <ArrowUp size={20} style={{ color: 'var(--accent)' }} />
            </button>
            <div />
            <button onClick={() => changeDirection('LEFT')} className="glass-card p-3 flex justify-center">
              <ChevronLeft size={20} style={{ color: 'var(--accent)' }} />
            </button>
            <button onClick={() => changeDirection('DOWN')} className="glass-card p-3 flex justify-center">
              <ArrowDown size={20} style={{ color: 'var(--accent)' }} />
            </button>
            <button onClick={() => changeDirection('RIGHT')} className="glass-card p-3 flex justify-center">
              <ArrowRight size={20} style={{ color: 'var(--accent)' }} />
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
