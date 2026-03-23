'use client';

import { useState, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

function checkWinner(board: Board): { winner: Cell; line: number[] | null } {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

function getAIMove(board: Board): number {
  // Simple AI: try to win, block, center, corners, random
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);

  // Try to win
  for (const i of empty) {
    const test = [...board];
    test[i] = 'O';
    if (checkWinner(test).winner === 'O') return i;
  }

  // Block player
  for (const i of empty) {
    const test = [...board];
    test[i] = 'X';
    if (checkWinner(test).winner === 'X') return i;
  }

  // Center
  if (board[4] === null) return 4;

  // Corners
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  // Random
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const { winner, line } = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || !isPlayerTurn || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = 'X';

      const result = checkWinner(newBoard);
      if (result.winner || newBoard.every((c) => c !== null)) {
        setBoard(newBoard);
        if (result.winner === 'X') setScores((s) => ({ ...s, player: s.player + 1 }));
        else if (!result.winner) setScores((s) => ({ ...s, draws: s.draws + 1 }));
        return;
      }

      setBoard(newBoard);
      setIsPlayerTurn(false);

      // AI move after short delay
      setTimeout(() => {
        const aiIndex = getAIMove(newBoard);
        const aiBoard = [...newBoard];
        aiBoard[aiIndex] = 'O';
        setBoard(aiBoard);
        setIsPlayerTurn(true);

        const aiResult = checkWinner(aiBoard);
        if (aiResult.winner === 'O') setScores((s) => ({ ...s, ai: s.ai + 1 }));
        else if (aiBoard.every((c) => c !== null) && !aiResult.winner)
          setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }, 400);
    },
    [board, isPlayerTurn, gameOver]
  );

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Piškvorky
          </h1>
        </div>

        {/* Scoreboard */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--rose)' }}>
              {scores.player}
            </p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Ty (X)
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>
              {scores.draws}
            </p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Remíza
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--lavender)' }}>
              {scores.ai}
            </p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              AI (O)
            </p>
          </div>
        </div>

        {/* Board */}
        <div className="flex justify-center mb-6">
          <div
            className="grid grid-cols-3 gap-2 p-3 rounded-2xl"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {board.map((cell, i) => {
              const isWinning = line?.includes(i);
              return (
                <motion.button
                  key={i}
                  whileTap={!cell && isPlayerTurn && !gameOver ? { scale: 0.9 } : {}}
                  onClick={() => handleCellClick(i)}
                  className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold transition-all"
                  style={{
                    background: isWinning
                      ? 'var(--accent-gradient)'
                      : 'var(--bg-card)',
                    boxShadow: isWinning ? 'var(--shadow-lg)' : 'var(--shadow)',
                    color: cell === 'X' ? 'var(--rose)' : 'var(--lavender)',
                  }}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {cell}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {gameOver ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {winner === 'X' ? '🎉 Vyhrála jsi!' : winner === 'O' ? '🤖 AI vyhrál!' : '🤝 Remíza!'}
              </p>
              <button
                onClick={reset}
                className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Znovu
              </button>
            </motion.div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isPlayerTurn ? 'Tvůj tah (X)' : 'AI přemýšlí...'}
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
