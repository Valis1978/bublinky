'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskCategory, TaskType } from '@/types/database';

interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    category?: TaskCategory;
    type?: TaskType;
    due_date?: string;
    emoji?: string;
  }) => void;
}

const categories: { value: TaskCategory; label: string; emoji: string }[] = [
  { value: 'school', label: 'Škola', emoji: '📚' },
  { value: 'home', label: 'Doma', emoji: '🏠' },
  { value: 'fun', label: 'Zábava', emoji: '🎉' },
  { value: 'event', label: 'Akce', emoji: '📅' },
];

const quickEmojis = ['📝', '🧹', '📚', '🎒', '⚽', '🎵', '🎨', '🏊', '🎿', '🎂'];

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('home');
  const [type, setType] = useState<TaskType>('one_time');
  const [dueDate, setDueDate] = useState('');
  const [emoji, setEmoji] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      type,
      due_date: dueDate || undefined,
      emoji: emoji || undefined,
    });
    setTitle('');
    setDescription('');
    setCategory('home');
    setType('one_time');
    setDueDate('');
    setEmoji('');
    setIsOpen(false);
  };

  return (
    <div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-3">
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Co je potřeba udělat?"
                className="w-full bg-transparent outline-none text-[15px] font-medium"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />

              {/* Description */}
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Popis (volitelné)"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-secondary)' }}
              />

              {/* Category pills */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setCategory(cat.value);
                      if (cat.value === 'event') setType('event');
                    }}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{
                      background:
                        category === cat.value ? 'var(--accent)' : 'var(--bg-input)',
                      color: category === cat.value ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Emoji picker */}
              <div className="flex gap-1.5 flex-wrap">
                {quickEmojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(emoji === e ? '' : e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all"
                    style={{
                      background: emoji === e ? 'var(--accent-soft)' : 'transparent',
                      border: emoji === e ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Due date */}
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className="accent-button flex-1 py-2.5 text-sm disabled:opacity-40"
                >
                  Přidat úkol
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Zrušit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={18} />
          Nový úkol
        </motion.button>
      )}
    </div>
  );
}
