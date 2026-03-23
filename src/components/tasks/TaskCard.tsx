'use client';

import { motion } from 'framer-motion';
import { Check, Trash2, Calendar, Clock } from 'lucide-react';
import type { BubTask } from '@/types/database';

interface TaskCardProps {
  task: BubTask;
  onToggle: (taskId: string, isCompleted: boolean) => void;
  onDelete?: (taskId: string) => void;
  isParent?: boolean;
}

const categoryColors: Record<string, string> = {
  school: '#60A5FA',
  home: '#34D399',
  fun: '#FBBF24',
  event: '#F472B6',
};

const categoryLabels: Record<string, string> = {
  school: 'Škola',
  home: 'Doma',
  fun: 'Zábava',
  event: 'Akce',
};

function getTimeLeft(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) return 'Prošlo';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `za ${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'}`;
  if (hours > 0) return `za ${hours} ${hours === 1 ? 'hodinu' : hours < 5 ? 'hodiny' : 'hodin'}`;
  return 'brzy!';
}

export function TaskCard({ task, onToggle, onDelete, isParent }: TaskCardProps) {
  const isCompleted = !!task.completed_at;
  const color = categoryColors[task.category] || '#9CA3AF';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="glass-card p-4 flex items-start gap-3"
      style={{ opacity: isCompleted ? 0.6 : 1 }}
    >
      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => onToggle(task.id, isCompleted)}
        className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all"
        style={{
          borderColor: isCompleted ? color : 'var(--border)',
          background: isCompleted ? color : 'transparent',
        }}
      >
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Check size={14} className="text-white" strokeWidth={3} />
          </motion.div>
        )}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {task.emoji && <span className="text-base">{task.emoji}</span>}
          <p
            className={`text-[15px] font-medium ${isCompleted ? 'line-through' : ''}`}
            style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}
          >
            {task.title}
          </p>
        </div>

        {task.description && (
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category badge */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {categoryLabels[task.category] || task.category}
          </span>

          {/* Due date */}
          {task.due_date && (
            <span
              className="text-[10px] flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {task.type === 'event' ? (
                <>
                  <Calendar size={10} />
                  {getTimeLeft(task.due_date)}
                </>
              ) : (
                <>
                  <Clock size={10} />
                  {new Date(task.due_date).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Delete (parent only) */}
      {isParent && onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.div>
  );
}
