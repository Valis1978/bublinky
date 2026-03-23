'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ListTodo } from 'lucide-react';
import { useState } from 'react';

export default function TasksPage() {
  const { user } = useAuth();
  const { pendingTasks, completedTasks, loading, createTask, toggleComplete, deleteTask } =
    useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const isParent = user?.role === 'parent';

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Úkolníček
          </h1>
          {completedTasks.length > 0 && (
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs font-medium flex items-center gap-1 px-3 py-1.5 rounded-full"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              <CheckCircle2 size={12} />
              {completedTasks.length} hotovo
            </button>
          )}
        </div>

        {/* Add task form (parent only) */}
        {isParent && <div className="mb-4"><TaskForm onSubmit={createTask} /></div>}

        {/* Pending tasks */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-t-transparent rounded-full"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)' }}
            >
              <ListTodo size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {isParent
                ? 'Zatím žádné úkoly. Přidej první!'
                : 'Žádné úkoly. Pohoda!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pendingTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={isParent ? deleteTask : undefined}
                  isParent={isParent}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Completed tasks */}
        {showCompleted && completedTasks.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
              Splněné
            </p>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={isParent ? deleteTask : undefined}
                  isParent={isParent}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
