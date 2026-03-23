import { createAdminClient } from '@/lib/supabase/admin';
import type { BubTask, TaskCategory, TaskType } from '@/types/database';

function getClient() {
  return createAdminClient();
}

export const taskService = {
  async getTasks(assignedTo?: string): Promise<{ data: BubTask[]; error?: string }> {
    const supabase = getClient();
    let query = supabase
      .from('bub_tasks')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data as BubTask[] };
  },

  async createTask(task: {
    created_by: string;
    assigned_to: string;
    title: string;
    description?: string;
    category?: TaskCategory;
    type?: TaskType;
    due_date?: string;
    emoji?: string;
    recurring_pattern?: Record<string, unknown>;
  }): Promise<{ data: BubTask | null; error?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('bub_tasks')
      .insert({
        created_by: task.created_by,
        assigned_to: task.assigned_to,
        title: task.title,
        description: task.description || null,
        category: task.category || 'home',
        type: task.type || 'one_time',
        due_date: task.due_date || null,
        emoji: task.emoji || null,
        recurring_pattern: task.recurring_pattern || null,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as BubTask };
  },

  async completeTask(taskId: string): Promise<{ error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from('bub_tasks')
      .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) return { error: error.message };
    return {};
  },

  async uncompleteTask(taskId: string): Promise<{ error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from('bub_tasks')
      .update({ completed_at: null, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) return { error: error.message };
    return {};
  },

  async deleteTask(taskId: string): Promise<{ error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from('bub_tasks')
      .delete()
      .eq('id', taskId);

    if (error) return { error: error.message };
    return {};
  },

  async updateTask(
    taskId: string,
    updates: Partial<Pick<BubTask, 'title' | 'description' | 'category' | 'type' | 'due_date' | 'emoji' | 'sort_order'>>
  ): Promise<{ error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from('bub_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) return { error: error.message };
    return {};
  },
};
