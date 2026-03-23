'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Bot, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

type Cell = 'X' | 'O' | null;
type Board = Cell[];
type GameMode = 'menu' | 'ai' | 'multi';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
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
  const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  for (const i of empty) { const t = [...board]; t[i] = 'O'; if (checkWinner(t).winner === 'O') return i; }
  for (const i of empty) { const t = [...board]; t[i] = 'X'; if (checkWinner(t).winner === 'X') return i; }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<GameMode>('menu');
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, opponent: 0, draws: 0 });
  const [multiStatus, setMultiStatus] = useState<'waiting' | 'playing' | 'disconnected'>('waiting');
  const [mySymbol, setMySymbol] = useState<'X' | 'O'>('X');
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const { winner, line } = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);
  const gameOver = !!winner || isDraw;

  // Multiplayer: Supabase Broadcast
  useEffect(() => {
    if (mode !== 'multi') return;

    const supabase = createClient();
    const channel = supabase.channel('bub-tictactoe', {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const { index, symbol } = payload as { index: number; symbol: 'X' | 'O' };
        setBoard((prev) => {
          const newBoard = [...prev];
          newBoard[index] = symbol;
          return newBoard;
        });
        setIsPlayerTurn(true);
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(Array(9).fill(null));
        setIsPlayerTurn(true);
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setMultiStatus('playing');
        // Second player gets O
        if (payload?.role !== user?.role) {
          setMySymbol(user?.role === 'child' ? 'X' : 'O');
          setIsPlayerTurn(user?.role === 'child'); // Child goes first
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'join', payload: { role: user?.role } });
          setMultiStatus('playing');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [mode, user?.role]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || !isPlayerTurn || gameOver) return;

      if (mode === 'ai') {
        // AI mode
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

        setTimeout(() => {
          const aiIndex = getAIMove(newBoard);
          const aiBoard = [...newBoard];
          aiBoard[aiIndex] = 'O';
          setBoard(aiBoard);
          setIsPlayerTurn(true);
          const aiResult = checkWinner(aiBoard);
          if (aiResult.winner === 'O') setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
          else if (aiBoard.every((c) => c !== null) && !aiResult.winner)
            setScores((s) => ({ ...s, draws: s.draws + 1 }));
        }, 400);
      } else {
        // Multiplayer mode
        const newBoard = [...board];
        newBoard[index] = mySymbol;
        setBoard(newBoard);
        setIsPlayerTurn(false);

        channelRef.current?.send({
          type: 'broadcast',
          event: 'move',
          payload: { index, symbol: mySymbol },
        });

        const result = checkWinner(newBoard);
        if (result.winner === mySymbol) setScores((s) => ({ ...s, player: s.player + 1 }));
        else if (result.winner) setScores((s) => ({ ...s, opponent: s.opponent + 1 }));
        else if (newBoard.every((c) => c !== null)) setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }
    },
    [board, isPlayerTurn, gameOver, mode, mySymbol]
  );

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(mode === 'ai' || mySymbol === 'X');
    if (mode === 'multi') {
      channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} });
    }
  };

  // Mode selection menu
  if (mode === 'menu') {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 gap-6">
          <div className="flex items-center gap-3 self-start absolute top-4 left-4">
            <Link href="/games" className="p-2" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
          </div>

          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Piškvorky
          </h1>

          <button
            onClick={() => setMode('ai')}
            className="w-full max-w-xs glass-card p-5 flex items-center gap-4 transition-transform active:scale-[0.98]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <Bot size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="text-left">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Proti AI</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hraj sám/sama</p>
            </div>
          </button>

          <button
            onClick={() => setMode('multi')}
            className="w-full max-w-xs glass-card p-5 flex items-center gap-4 transition-transform active:scale-[0.98]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F620, #10B98120)' }}
            >
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

  const opponentName = mode === 'ai' ? 'AI' : 'Táta';
  const myName = user?.role === 'child' ? 'Ty' : 'Ty';

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setMode('menu')} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Piškvorky {mode === 'multi' && '(multiplayer)'}
          </h1>
        </div>

        {/* Multiplayer status */}
        {mode === 'multi' && multiStatus === 'waiting' && (
          <div className="glass-card p-4 mb-4 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-t-transparent rounded-full mx-auto mb-2"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Čekám na druhého hráče...
            </p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--rose)' }}>{scores.player}</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {myName} ({mode === 'multi' ? mySymbol : 'X'})
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>{scores.draws}</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Remíza</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--lavender)' }}>{scores.opponent}</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {opponentName} ({mode === 'multi' ? (mySymbol === 'X' ? 'O' : 'X') : 'O'})
            </p>
          </div>
        </div>

        {/* Board */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
            {board.map((cell, i) => {
              const isWinning = line?.includes(i);
              return (
                <motion.button
                  key={i}
                  whileTap={!cell && isPlayerTurn && !gameOver ? { scale: 0.9 } : {}}
                  onClick={() => handleCellClick(i)}
                  className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl font-bold transition-all"
                  style={{
                    background: isWinning ? 'var(--accent-gradient)' : 'var(--bg-card)',
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {winner === (mode === 'multi' ? mySymbol : 'X')
                  ? '🎉 Vyhrála jsi!'
                  : winner
                    ? `${opponentName} vyhrál!`
                    : '🤝 Remíza!'}
              </p>
              <button onClick={reset} className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2">
                <RotateCcw size={16} />
                Znovu
              </button>
            </motion.div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {isPlayerTurn ? 'Tvůj tah' : mode === 'ai' ? 'AI přemýšlí...' : 'Čekám na tátu...'}
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
