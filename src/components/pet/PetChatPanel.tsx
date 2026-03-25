'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import type { PetState } from '@/lib/pet-engine';

interface ChatMessage {
  id: string;
  role: 'user' | 'pet';
  content: string;
  emotion?: string;
  timestamp: Date;
}

interface PetChatPanelProps {
  pet: PetState;
  petId?: string;
}

export function PetChatPanel({ pet, petId }: PetChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greetings = [
      `Ahoj Viki! 🐾 Jak se máš?`,
      `Hej! Stýskalo se mi! ❤️`,
      `Jupí, jsi tady! 🎉`,
      `Čau Viki! Co je novýho? 😊`,
    ];
    setMessages([{
      id: 'greeting',
      role: 'pet',
      content: greetings[Math.floor(Math.random() * greetings.length)],
      emotion: 'happy',
      timestamp: new Date(),
    }]);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

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
          message: text,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const petMsg: ChatMessage = {
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
    } finally {
      setLoading(false);
    }
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

      {/* Input */}
      <div
        className="p-3 flex gap-2"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-nav)' }}
      >
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
          className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Send size={16} />
        </motion.button>
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
