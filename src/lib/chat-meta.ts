// Chat message extras (reply / edit / delete) live in bub_messages.media_metadata
// so they need no schema change. Shared by the API routes and the chat UI.

/** Snapshot of the quoted message, taken when the reply is sent. */
export interface ReplySnapshot {
  id: string;
  sender_id: string;
  type: string;
  preview: string;
}

export interface ChatMeta {
  reply_to?: ReplySnapshot;
  edited_at?: string;
  deleted_at?: string;
  [key: string]: unknown;
}

/** Own messages can be edited or unsent for this long (same as iMessage). */
export const EDIT_WINDOW_MS = 15 * 60 * 1000;

/** Keys only the server may write — stripped from client-supplied metadata. */
export const SERVER_META_KEYS = ['reply_to', 'edited_at', 'deleted_at'] as const;

export function readMeta(value: unknown): ChatMeta {
  return value && typeof value === 'object' ? (value as ChatMeta) : {};
}

export function withinEditWindow(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
}

const TYPE_PREVIEW: Record<string, string> = {
  photo: '📷 Fotka',
  video: '🎥 Video',
  voice: '🎤 Hlasovka',
  sticker: '🎁 Samolepka',
};

export function previewOf(message: { type: string; content: string | null }): string {
  const text = message.content?.trim();
  if (message.type === 'text' && text) return text.length > 90 ? `${text.slice(0, 90)}…` : text;
  return TYPE_PREVIEW[message.type] ?? (text || 'Zpráva');
}

// 1–3 emoji and nothing else → render big, like iMessage/WhatsApp.
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*\s*){1,3}$/u;

export function isEmojiOnly(text: string | null): boolean {
  return !!text && EMOJI_ONLY.test(text.trim());
}

/** Split text into plain and link parts so URLs can be rendered clickable. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  let last = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    // Trailing punctuation belongs to the sentence, not the URL
    const url = match[0].replace(/[.,!?)]+$/, '');
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: url, href: url.startsWith('www.') ? `https://${url}` : url });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
