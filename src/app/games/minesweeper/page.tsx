'use client';

import { useState, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Flag, Bomb } from 'lucide-react';
import Link from 'next/link';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

function createBoard(): CellState[][] {
  const board: CellState[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  // Place mines
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].isMine) {
      board[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }

  return board;
}

function revealEmpty(board: CellState[][], r: number, c: number): CellState[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const stack: [number, number][] = [[r, c]];

  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (newBoard[cr][cc].isRevealed || newBoard[cr][cc].isFlagged) continue;

    newBoard[cr][cc].isRevealed = true;

    if (newBoard[cr][cc].adjacentMines === 0 && !newBoard[cr][cc].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          stack.push([cr + dr, cc + dc]);
        }
      }
    }
  }

  return newBoard;
}

const numberColors = ['', '#3B82F6', '#22C55E', '#EF4444', '#7C3AED', '#DC2626', '#0EA5E9', '#1F2937', '#6B7280'];

export default function MinesweeperPage() {
  const [board, setBoard] = useState(() => createBoard());
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false);

  const flagsPlaced = board.flat().filter((c) => c.isFlagged).length;
  const revealed = board.flat().filter((c) => c.isRevealed).length;

  const checkWin = useCallback(
    (b: CellState[][]) => {
      const nonMines = ROWS * COLS - MINES;
      const revealedCount = b.flat().filter((c) => c.isRevealed).length;
      if (revealedCount === nonMines) {
        setIsWon(true);
        setGameOver(true);
      }
    },
    []
  );

  const handleClick = (r: number, c: number) => {
    if (gameOver || board[r][c].isRevealed) return;

    if (flagMode) {
      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
      setBoard(newBoard);
      return;
    }

    if (board[r][c].isFlagged) return;

    if (board[r][c].isMine) {
      // Game over — reveal all mines
      const newBoard = board.map((row) =>
        row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
      );
      setBoard(newBoard);
      setGameOver(true);
      return;
    }

    const newBoard = revealEmpty(board, r, c);
    setBoard(newBoard);
    checkWin(newBoard);
  };

  const reset = () => {
    setBoard(createBoard());
    setGameOver(false);
    setIsWon(false);
    setFlagMode(false);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Hledání min
          </h1>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--coral)' }}>
              <Bomb size={14} className="inline mr-1" />
              {MINES - flagsPlaced}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Min</p>
          </div>
          <button
            onClick={() => setFlagMode(!flagMode)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: flagMode ? 'var(--accent)' : 'var(--bg-input)',
              color: flagMode ? 'white' : 'var(--text-secondary)',
            }}
          >
            <Flag size={14} className="inline mr-1" />
            {flagMode ? 'Vlajka ON' : 'Vlajka'}
          </button>
        </div>

        {/* Board */}
        <div className="flex justify-center">
          <div
            className="inline-grid gap-0.5 p-2 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              background: 'var(--bg-secondary)',
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => (
                <motion.button
                  key={`${r}-${c}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleClick(r, c)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: cell.isRevealed
                      ? cell.isMine
                        ? 'var(--coral)'
                        : 'var(--bg-card)'
                      : 'var(--accent-soft)',
                    border: cell.isRevealed ? 'none' : '1px solid var(--border)',
                    color: cell.isRevealed
                      ? numberColors[cell.adjacentMines] || 'var(--text-primary)'
                      : 'var(--accent)',
                  }}
                >
                  {cell.isRevealed && cell.isMine && '💣'}
                  {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
                  {!cell.isRevealed && cell.isFlagged && '🚩'}
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Game over / Win */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 space-y-3"
          >
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {isWon ? '🎉 Vyhrála jsi!' : '💥 Bum!'}
            </p>
            <button onClick={reset} className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Znovu
            </button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
