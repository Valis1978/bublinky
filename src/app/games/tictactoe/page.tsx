'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Bot, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { createClient } from '@/lib/supabase/client';

type Cell = 'X' | 'O' | null;
type GameMode = 'menu' | 'ai' | 'multi';

const SIZE = 15;
const WIN_LENGTH = 5;
const CELL_PX = 24; // pixel size per cell — 15*24=360 fits iPhone 375px

function createBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

// Check for 5 in a row from a specific position
function checkWinAt(board: Cell[][], r: number, c: number): { winner: Cell; line: [number, number][] } | null {
  const cell = board[r][c];
  if (!cell) return null;

  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal \
    [1, -1], // diagonal /
  ];

  for (const [dr, dc] of directions) {
    const line: [number, number][] = [[r, c]];
    // Forward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== cell) break;
      line.push([nr, nc]);
    }
    // Backward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== cell) break;
      line.push([nr, nc]);
    }
    if (line.length >= WIN_LENGTH) {
      return { winner: cell, line };
    }
  }
  return null;
}

function checkWinner(board: Cell[][]): { winner: Cell; line: [number, number][] | null } {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const result = checkWinAt(board, r, c);
      if (result) return result;
    }
  }
  return { winner: null, line: null };
}

// AI: score positions based on patterns
function scorePosition(board: Cell[][], r: number, c: number, player: Cell): number {
  if (board[r][c] !== null) return -1;

  let score = 0;
  const opponent = player === 'X' ? 'O' : 'X';
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    let myCount = 0;
    let openEnds = 0;

    // Count consecutive in both directions
    for (let dir = -1; dir <= 1; dir += 2) {
      let blocked = false;
      for (let i = 1; i <= 4; i++) {
        const nr = r + dr * i * dir;
        const nc = c + dc * i * dir;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) { blocked = true; break; }
        if (board[nr][nc] === player) myCount++;
        else if (board[nr][nc] === opponent) { blocked = true; break; }
        else { if (i === 1) openEnds++; break; }
      }
      if (!blocked && myCount === 0) openEnds++;
    }

    // Score based on pattern
    if (myCount >= 4) score += 100000; // Win
    else if (myCount === 3 && openEnds >= 2) score += 10000; // Open 4
    else if (myCount === 3) score += 1000;
    else if (myCount === 2 && openEnds >= 2) score += 500;
    else if (myCount === 2) score += 100;
    else if (myCount === 1 && openEnds >= 2) score += 50;
    else if (openEnds >= 1) score += 10;
  }

  // Center bonus
  const centerDist = Math.abs(r - 7) + Math.abs(c - 7);
  score += Math.max(0, 14 - centerDist);

  return score;
}

function getAIMove(board: Cell[][]): [number, number] {
  let bestScore = -1;
  let bestMoves: [number, number][] = [];

  // Only consider cells near existing pieces
  const candidates = new Set<string>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== null) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === null) {
              candidates.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  // If empty board, play center
  if (candidates.size === 0) return [7, 7];

  for (const key of candidates) {
    const [r, c] = key.split(',').map(Number);

    // Score for AI (offensive) + score for blocking player (defensive)
    const offensiveScore = scorePosition(board, r, c, 'O');
    const defensiveScore = scorePosition(board, r, c, 'X');
    const total = offensiveScore + defensiveScore * 0.9; // Slightly prefer offense

    if (total > bestScore) {
      bestScore = total;
      bestMoves = [[r, c]];
    } else if (total === bestScore) {
      bestMoves.push([r, c]);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export default function TicTacToePage() {
  const { user } = useAuth();
  const { winGame } = useStats();
  const [mode, setMode] = useState<GameMode>('menu');
  const [board, setBoard] = useState<Cell[][]>(createBoard());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [multiStatus, setMultiStatus] = useState<'waiting' | 'playing'>('waiting');
  const [mySymbol, setMySymbol] = useState<'X' | 'O'>('X');
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const { winner, line } = checkWinner(board);
  const gameOver = !!winner;

  // Scroll to last move
  useEffect(() => {
    if (lastMove && boardRef.current) {
      const cell = boardRef.current.querySelector(`[data-pos="${lastMove[0]}-${lastMove[1]}"]`);
      cell?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [lastMove]);

  // Multiplayer
  useEffect(() => {
    if (mode !== 'multi') return;
    const supabase = createClient();
    const channel = supabase.channel('bub-tictactoe-v2', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const { row, col, symbol } = payload as { row: number; col: number; symbol: 'X' | 'O' };
        setBoard((prev) => {
          const newBoard = prev.map((r) => [...r]);
          newBoard[row][col] = symbol;
          return newBoard;
        });
        setLastMove([row, col]);
        setIsPlayerTurn(true);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(createBoard());
        setLastMove(null);
        setIsPlayerTurn(true);
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setMultiStatus('playing');
        if (payload?.role !== user?.role) {
          setMySymbol(user?.role === 'child' ? 'X' : 'O');
          setIsPlayerTurn(user?.role === 'child');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'join', payload: { role: user?.role } });
          setMultiStatus('playing');
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [mode, user?.role]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (board[r][c] || !isPlayerTurn || gameOver) return;

      if (mode === 'ai') {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = 'X';
        setBoard(newBoard);
        setLastMove([r, c]);

        const result = checkWinner(newBoard);
        if (result.winner === 'X') {
          winGame();
          setScores((s) => ({ ...s, player: s.player + 1 }));
          return;
        }

        setIsPlayerTurn(false);
        setTimeout(() => {
          const [ar, ac] = getAIMove(newBoard);
          const aiBoard = newBoard.map((row) => [...row]);
          aiBoard[ar][ac] = 'O';
          setBoard(aiBoard);
          setLastMove([ar, ac]);
          setIsPlayerTurn(true);

          const aiResult = checkWinner(aiBoard);
          if (aiResult.winner === 'O') {
            setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
          }
        }, 300);
      } else {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = mySymbol;
        setBoard(newBoard);
        setLastMove([r, c]);
        setIsPlayerTurn(false);

        channelRef.current?.send({
          type: 'broadcast',
          event: 'move',
          payload: { row: r, col: c, symbol: mySymbol },
        });

        const result = checkWinner(newBoard);
        if (result.winner === mySymbol) { winGame(); setScores((s) => ({ ...s, player: s.player + 1 })); }
        else if (result.winner) setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
      }
    },
    [board, isPlayerTurn, gameOver, mode, mySymbol, winGame]
  );

  const reset = () => {
    setBoard(createBoard());
    setLastMove(null);
    setIsPlayerTurn(mode === 'ai' || mySymbol === 'X');
    if (mode === 'multi') {
      channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
    }
  };

  // Mode menu
  if (mode === 'menu') {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-nav gap-6">
          <div className="absolute top-4 left-4">
            <Link href="/games" className="p-2" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Piškvorky</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>15×15, pět v řadě</p>

          <button onClick={() => setMode('ai')}
            className="w-full max-w-xs glass-card p-5 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Bot size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-left">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Proti AI</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hraj sám/sama</p>
            </div>
          </button>

          <button onClick={() => setMode('multi')}
            className="w-full max-w-xs glass-card p-5 flex items-center gap-4 transition-transform active:scale-[0.98]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F620, #10B98120)' }}>
              <Users size={24} style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-left">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>S tátou</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time hra</p>
            </div>
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const winSet = new Set(line?.map(([r, c]) => `${r}-${c}`) || []);
  const opponentName = mode === 'ai' ? 'AI' : 'Táta';

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col p-2 pb-nav safe-top">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-2">
          <button onClick={() => setMode('menu')} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-4 text-center">
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--rose)' }}>{scores.player}</span>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Ty</p>
            </div>
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--lavender)' }}>{scores.opponent}</span>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{opponentName}</p>
            </div>
          </div>
          <button onClick={reset} style={{ color: 'var(--text-muted)' }}>
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-1">
          {gameOver ? (
            <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {winner === (mode === 'multi' ? mySymbol : 'X') ? '🎉 Vyhrála jsi!' : `${opponentName} vyhrál!`}
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isPlayerTurn ? 'Tvůj tah' : mode === 'ai' ? 'AI přemýšlí...' : 'Čekám na tátu...'}
            </p>
          )}
        </div>

        {/* Board — scrollable */}
        <div
          ref={boardRef}
          className="flex-1 overflow-auto rounded-xl"
          style={{ background: 'var(--bg-secondary)', touchAction: 'pan-x pan-y' }}
        >
          <div
            className="inline-grid gap-px p-1"
            style={{
              gridTemplateColumns: `repeat(${SIZE}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${SIZE}, ${CELL_PX}px)`,
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWin = winSet.has(`${r}-${c}`);
                const isLast = lastMove?.[0] === r && lastMove?.[1] === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    data-pos={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className="flex items-center justify-center text-sm font-bold rounded-sm transition-all"
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      background: isWin
                        ? 'var(--accent)'
                        : isLast
                          ? 'var(--accent-soft)'
                          : 'var(--bg-card)',
                      color: cell === 'X' ? 'var(--rose)' : cell === 'O' ? 'var(--lavender)' : 'transparent',
                      border: isLast ? '2px solid var(--accent)' : 'none',
                    }}
                  >
                    {cell && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      >
                        {cell}
                      </motion.span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Game over button */}
        {gameOver && (
          <div className="text-center mt-2">
            <button onClick={reset} className="accent-button px-6 py-2 text-sm inline-flex items-center gap-2">
              <RotateCcw size={14} />
              Nová hra
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
