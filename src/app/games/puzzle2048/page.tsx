'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const SIZE = 4;

type Grid = number[][];

function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push([r, c]); }));
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function rotateGrid(grid: Grid): Grid {
  return grid[0].map((_, c) => grid.map((row) => row[c]).reverse());
}

function slideRow(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  const merged: number[] = [];

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { row: merged, score };
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newGrid = grid.map((row) => {
    const { row: newRow, score } = slideRow(row);
    totalScore += score;
    if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
    return newRow;
  });
  return { grid: newGrid, score: totalScore, moved };
}

function move(grid: Grid, dir: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } {
  let g = grid;
  const rotations = { left: 0, up: 1, right: 2, down: 3 };
  for (let i = 0; i < rotations[dir]; i++) g = rotateGrid(g);
  const result = moveLeft(g);
  let rg = result.grid;
  for (let i = 0; i < (4 - rotations[dir]) % 4; i++) rg = rotateGrid(rg);
  return { ...result, grid: rg };
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

const tileColors: Record<number, { bg: string; text: string }> = {
  0: { bg: 'var(--bg-input)', text: 'transparent' },
  2: { bg: '#FFF0F5', text: '#776E65' },
  4: { bg: '#FCE7F3', text: '#776E65' },
  8: { bg: '#F9A8D4', text: 'white' },
  16: { bg: '#F472B6', text: 'white' },
  32: { bg: '#EC4899', text: 'white' },
  64: { bg: '#DB2777', text: 'white' },
  128: { bg: '#C4B5FD', text: 'white' },
  256: { bg: '#A78BFA', text: 'white' },
  512: { bg: '#8B5CF6', text: 'white' },
  1024: { bg: '#7C3AED', text: 'white' },
  2048: { bg: '#86EFAC', text: '#1F2937' },
};

export default function Puzzle2048Page() {
  const [grid, setGrid] = useState<Grid>(() => addRandomTile(addRandomTile(createEmptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bub_2048_best');
    if (saved) setBest(parseInt(saved, 10));
  }, []);

  const handleMove = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;
      const result = move(grid, dir);
      if (!result.moved) return;

      const newGrid = addRandomTile(result.grid);
      const newScore = score + result.score;
      setGrid(newGrid);
      setScore(newScore);

      if (newScore > best) {
        setBest(newScore);
        localStorage.setItem('bub_2048_best', String(newScore));
      }

      // Check 2048
      if (newGrid.flat().includes(2048) && !won) {
        setWon(true);
      }

      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    },
    [grid, score, best, gameOver, won]
  );

  // Keyboard + Swipe
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(map[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  // Touch swipe
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 30) return;
      if (absDx > absDy) handleMove(dx > 0 ? 'right' : 'left');
      else handleMove(dy > 0 ? 'down' : 'up');
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, [handleMove]);

  const reset = () => {
    setGrid(addRandomTile(addRandomTile(createEmptyGrid())));
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col items-center p-4 pb-24 safe-top">
        <div className="flex items-center gap-3 mb-4 self-stretch">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>2048</h1>
          <div className="ml-auto flex gap-4 text-sm">
            <span className="font-bold" style={{ color: 'var(--accent)' }}>{score}</span>
            <span style={{ color: 'var(--text-muted)' }}>Best: {best}</span>
          </div>
        </div>

        {/* Grid */}
        <div
          className="grid gap-2 p-2 rounded-2xl touch-none"
          style={{
            gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
            background: 'var(--bg-secondary)',
          }}
        >
          {grid.flat().map((value, i) => {
            const colors = tileColors[value] || tileColors[2048];
            return (
              <motion.div
                key={i}
                layout
                className="w-[72px] h-[72px] rounded-xl flex items-center justify-center font-bold transition-all"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  fontSize: value >= 1024 ? 18 : value >= 128 ? 22 : 26,
                }}
                animate={value > 0 ? { scale: [0.8, 1.05, 1] } : {}}
                transition={{ duration: 0.15 }}
              >
                {value > 0 && value}
              </motion.div>
            );
          })}
        </div>

        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Swipuj nebo šipky
        </p>

        {(gameOver || won) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-4 space-y-2">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {won ? '🎉 2048! Skóre: ' + score : '😅 Konec! Skóre: ' + score}
            </p>
            <button onClick={reset} className="accent-button px-5 py-2 text-sm inline-flex items-center gap-2">
              <RotateCcw size={14} />
              Znovu
            </button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
