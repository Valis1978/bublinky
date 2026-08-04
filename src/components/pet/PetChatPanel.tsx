'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import type { PetState } from '@/lib/pet-engine';
import { CHAT_GAMES, getActiveMode, setActiveMode, type ChatGameMode } from '@/lib/chat-games';

export interface ChatMessage {
  id: string;
  role: 'user' | 'pet';
  content: string;
  emotion?: string;
  timestamp: Date;
}

interface PetChatPanelProps {
  pet: PetState;
  petId?: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

interface LastStory {
  title: string;
  summary: string;
}

/** Chip order matches the FUN sprint spec exactly. */
const GAME_MODE_ORDER: ChatGameMode[] = ['hadanka', 'hadej-zvire', 'stridacka', 'co-bys-radsi'];

/** Local (no-API) line the pet "says" the instant a game chip is tapped. */
const GAME_START_MESSAGE: Record<ChatGameMode, string> = {
  'hadanka': 'Jupí, hádanky! 🧩',
  'hadej-zvire': 'Jupí, hádej zvíře! 🦁',
  'stridacka': 'Jupí, příběh na střídačku! 📖',
  'co-bys-radsi': 'Jupí, co bys radši! 🤔',
};

/** Hidden trigger text — route.ts reads this as "open with the game's first move". */
const GAME_KICKOFF_MESSAGE = '[START HRY]';

const LAST_STORY_KEY = 'bub_last_story';
const LAST_STORY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Reads a fresh, not-yet-discussed finished story from localStorage — best-effort. */
function readPendingLastStory(): LastStory | null {
  try {
    const raw = localStorage.getItem(LAST_STORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { title?: unknown; summary?: unknown; at?: unknown; talked?: unknown };
    if (parsed.talked || typeof parsed.title !== 'string' || typeof parsed.summary !== 'string') return null;
    const atMs = typeof parsed.at === 'string' ? new Date(parsed.at).getTime() : NaN;
    if (!Number.isFinite(atMs) || Date.now() - atMs >= LAST_STORY_MAX_AGE_MS) return null;
    return { title: parsed.title, summary: parsed.summary };
  } catch {
    return null;
  }
}

/** Marks the story talked-about so it's only ever offered to the chat once. */
function markLastStoryTalked(): void {
  try {
    const raw = localStorage.getItem(LAST_STORY_KEY);
    if (!raw) return;
    localStorage.setItem(LAST_STORY_KEY, JSON.stringify({ ...JSON.parse(raw), talked: true }));
  } catch { /* best effort */ }
}

export function PetChatPanel({ pet, petId, messages, setMessages }: PetChatPanelProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveModeState] = useState<ChatGameMode | null>(() => getActiveMode());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Populated on mount when there's a story to talk about; consumed by the first request.
  const pendingLastStory = useRef<LastStory | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting — only if no messages yet
  useEffect(() => {
    if (messages.length === 0) {
      const greetings = [
        `Ahoj! 🐾 Jak se máš?`,
        `Hej! Stýskalo se mi! ❤️`,
        `Jupí, jsi tady! 🎉`,
        `Čau! Co je novýho? 😊`,
      ];
      setMessages([{
        id: 'greeting',
        role: 'pet',
        content: greetings[Math.floor(Math.random() * greetings.length)],
        emotion: 'happy',
        timestamp: new Date(),
      }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up a freshly-finished, not-yet-discussed story once per mount.
  useEffect(() => {
    pendingLastStory.current = readPendingLastStory();
  }, []);

  /** Shared POST to the pet chat API — used by both typed messages and game kick-offs. */
  const postChat = async (message: string, gameMode: ChatGameMode | null) => {
    const lastStory = pendingLastStory.current;
    if (lastStory) {
      pendingLastStory.current = null;
      markLastStoryTalked();
    }

    try {
      const res = await fetch('/api/pet/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId,
          petName: pet.name,
          species: pet.species,
          stage: pet.stage,
          level: pet.level,
          mood: pet.mood,
          hunger: pet.hunger,
          happiness: pet.happiness,
          energy: pet.energy,
          cleanliness: pet.cleanliness,
          skills: pet.skills,
          personalityTraits: pet.personalityTraits,
          foodBravery: pet.foodBravery,
          evolutionPath: pet.evolutionPath,
          message,
          gameMode: gameMode ?? undefined,
          ...(lastStory ? { lastStory } : {}),
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const petMsg: ChatMessage = {
          // eslint-disable-next-line react-hooks/purity -- only runs from event-triggered postChat, never during render
          id: `pet-${Date.now()}`,
          role: 'pet',
          content: data.reply,
          emotion: data.emotion,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, petMsg]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'pet',
        content: '*zívá*... Promiň, zaspal/a jsem na chvilku 😴',
        emotion: 'sleepy',
        timestamp: new Date(),
      }]);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      // eslint-disable-next-line react-hooks/purity -- only runs from the onClick/onKeyDown handler, never during render
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    await postChat(text, activeMode);
    setLoading(false);
  };

  /** Chip tap — switches mode, greets locally, then kicks off the API for the first move. */
  const startGame = (mode: ChatGameMode) => {
    if (loading) return;
    setActiveMode(mode);
    setActiveModeState(mode);
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      role: 'pet',
      content: GAME_START_MESSAGE[mode],
      emotion: 'excited',
      timestamp: new Date(),
    }]);
    setLoading(true);
    void postChat(GAME_KICKOFF_MESSAGE, mode).finally(() => setLoading(false));
  };

  const endGame = () => {
    setActiveMode(null);
    setActiveModeState(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-sm'
                    : 'rounded-bl-sm'
                }`}
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  boxShadow: msg.role === 'pet' ? 'var(--shadow)' : 'none',
                }}
              >
                {msg.role === 'pet' && msg.emotion && (
                  <span className="mr-1">{getEmotionEmoji(msg.emotion)}</span>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1 px-3 py-2 rounded-2xl w-fit"
            style={{ background: 'var(--bg-card)' }}
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--text-muted)' }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Game chips + input */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-nav)' }}>
        <div className="px-3 pt-2 flex gap-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
          {activeMode && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={endGame}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ✖ Konec hry
            </motion.button>
          )}
          {GAME_MODE_ORDER.map(id => {
            const game = CHAT_GAMES[id];
            const active = activeMode === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.94 }}
                onClick={() => startGame(id)}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                style={{
                  background: active ? 'var(--accent)' : 'var(--bg-card)',
                  color: active ? '#FFFFFF' : 'var(--text-primary)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <span>{game.emoji}</span>
                {game.label}
              </motion.button>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Napiš ${pet.name}...`}
            className="flex-1 px-4 py-2.5 rounded-2xl text-sm"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            disabled={loading}
            maxLength={200}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-30"
            style={{ background: 'var(--accent)', color: 'white' }}
            aria-label="Odeslat zprávu"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function getEmotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    happy: '😊', sad: '😢', excited: '🤩', sleepy: '😴',
    hungry: '🍽️', playful: '🎮', grateful: '🥰', shy: '🙈', curious: '🤔',
  };
  return map[emotion] || '';
}
