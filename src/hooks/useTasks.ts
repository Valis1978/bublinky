'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BubTask, TaskCategory, TaskType } from '@/types/database';

export function useTasks() {
  const [tasks, setTasks] = useState<BubTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if (data.success) {
      setTasks(data.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (task: {
      title: string;
      description?: string;
      category?: TaskCategory;
      type?: TaskType;
      due_date?: string;
      emoji?: string;
    }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [data.data, ...prev]);
      }
      return data;
    },
    []
  );

  const toggleComplete = useCallback(async (taskId: string, isCompleted: boolean) => {
    const action = isCompleted ? 'uncomplete' : 'complete';
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, completed_at: isCompleted ? null : new Date().toISOString() }
            : t
        )
      );
    }
    return data;
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
    return data;
  }, []);

  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => t.completed_at);

  return { tasks, pendingTasks, completedTasks, loading, createTask, toggleComplete, deleteTask, refetch: fetchTasks };
}
