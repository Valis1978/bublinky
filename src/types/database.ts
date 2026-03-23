// Bublinky Database Types

export type UserRole = 'parent' | 'child';
export type MessageType = 'text' | 'photo' | 'voice';
export type TaskCategory = 'school' | 'home' | 'fun' | 'event';
export type TaskType = 'one_time' | 'recurring' | 'event';

export interface BubUser {
  id: string;
  name: string;
  pin_hash: string;
  role: UserRole;
  avatar_url: string | null;
  theme: string;
  settings: Record<string, unknown>;
  push_subscription: Record<string, unknown> | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BubMessage {
  id: string;
  sender_id: string;
  content: string | null;
  type: MessageType;
  media_url: string | null;
  media_metadata: {
    duration_ms?: number;
    width?: number;
    height?: number;
    mime_type?: string;
  } | null;
  read_at: string | null;
  created_at: string;
}

export interface BubTask {
  id: string;
  created_by: string;
  assigned_to: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  type: TaskType;
  due_date: string | null;
  recurring_pattern: {
    frequency: 'daily' | 'weekly';
    days?: number[];
  } | null;
  completed_at: string | null;
  emoji: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface SessionPayload {
  user_id: string;
  role: UserRole;
  name: string;
  iat: number;
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
