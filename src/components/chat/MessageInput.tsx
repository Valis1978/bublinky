'use client';

import { useState, useRef, useLayoutEffect, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Video, Mic, Sticker as StickerIcon, Reply, Pencil, X, Check } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { loadPet } from '@/lib/pet-engine';
import { stickerFile, STICKERS } from '@/lib/sticker-catalog';

interface MessageInputProps {
  onSend: (content: string) => void;
  onPhoto?: (file: File) => void;
  onVideo?: (file: File) => void;
  onVoice?: (blob: Blob) => void;
  onSticker?: (stickerId: string) => void;
  disabled?: boolean;
  /** Quoted message shown above the field while replying */
  replyTo?: { name: string; preview: string } | null;
  onCancelReply?: () => void;
  /** Set while editing an own message — the field starts with its text */
  editing?: boolean;
  initialText?: string;
  onCancelEdit?: () => void;
  onTyping?: () => void;
}

const MAX_ROWS_PX = 120;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MessageInput({
  onSend, onPhoto, onVideo, onVoice, onSticker, disabled,
  replyTo, onCancelReply, editing, initialText = '', onCancelEdit, onTyping,
}: MessageInputProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow with the text up to ~5 lines, then scroll inside
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [text]);
  const [stickerSheetOpen, setStickerSheetOpen] = useState(false);
  const [ownedStickers, setOwnedStickers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  };

  // Phones insert a newline on Return (like WhatsApp); a hardware keyboard sends
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    e.preventDefault();
    handleSubmit(e as unknown as FormEvent);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhoto) {
      onPhoto(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onVideo) {
      onVideo(file);
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob && onVoice) {
        onVoice(blob);
      }
    } else {
      await startRecording();
    }
  };

  const handleOpenStickerSheet = () => {
    const pet = loadPet();
    setOwnedStickers(pet?.stickers ?? []);
    setStickerSheetOpen(true);
  };

  const handleStickerPick = (stickerId: string) => {
    setStickerSheetOpen(false);
    onSticker?.(stickerId);
  };

  const hasContent = text.trim().length > 0;

  // Recording mode
  if (isRecording) {
    return (
      <div
        className="flex items-center gap-3 p-3 safe-bottom"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          className="text-xs font-medium px-3 py-2 rounded-full"
          style={{ color: 'var(--coral)', background: 'rgba(239,68,68,0.1)' }}
        >
          Zrušit
        </button>

        {/* Recording indicator */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-red-500"
          />
          <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(duration)}
          </span>
        </div>

        {/* Stop & Send */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceToggle}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Send size={20} className="text-white" />
        </motion.button>
      </div>
    );
  }

  return (
    <>
      {/* Sticker sheet — grid of collected stickers */}
      <AnimatePresence>
        {stickerSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] bg-black/30"
              onClick={() => setStickerSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 right-0 bottom-0 z-[60] rounded-t-3xl p-4 pb-6 safe-bottom max-h-[60vh] overflow-y-auto"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--border)' }} />
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Samolepky
              </h3>
              {ownedStickers.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  Samolepky nasbíráš v albu a v dárečcích! 🎁
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3 pb-2">
                  {ownedStickers.map((id) => {
                    const def = STICKERS[id];
                    if (!def) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleStickerPick(id)}
                        className="flex flex-col items-center gap-1 p-2 rounded-2xl active:scale-95 transition-transform"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <img
                          src={stickerFile(id)}
                          alt={def.name}
                          width={56}
                          height={56}
                          style={{ aspectRatio: '1 / 1' }}
                        />
                        <span
                          className="text-[10px] text-center leading-tight"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {def.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    <div
      style={{
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Reply / edit context bar */}
      <AnimatePresence initial={false}>
        {(replyTo || editing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 pt-2.5">
              <div className="flex-shrink-0" style={{ color: 'var(--accent)' }}>
                {editing ? <Pencil size={18} /> : <Reply size={18} />}
              </div>
              <div
                className="flex-1 min-w-0 pl-2.5"
                style={{ borderLeft: '3px solid var(--accent)' }}
              >
                <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  {editing ? 'Úprava zprávy' : `Odpověď pro ${replyTo!.name}`}
                </p>
                <p className="text-[13px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {editing ? initialText : replyTo!.preview}
                </p>
              </div>
              <button
                type="button"
                onClick={editing ? onCancelEdit : onCancelReply}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
                aria-label="Zrušit"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 safe-bottom"
    >
      {!editing && (<>
      {/* Photo/Gallery button — opens iOS photo picker (gallery + camera) */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <ImageIcon size={20} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp,video/mp4,video/quicktime"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera button — opens camera directly */}
      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <Video size={20} />
      </button>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleVideoChange}
        className="hidden"
      />

      {/* Sticker button — opens the collected-stickers sheet */}
      <button
        type="button"
        onClick={handleOpenStickerSheet}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <StickerIcon size={20} />
      </button>
      </>)}

      {/* Text input */}
      <div
        className="flex-1 rounded-3xl px-4 py-2.5 transition-all"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Napiš zprávu..."
          disabled={disabled}
          autoFocus={editing}
          className="w-full bg-transparent outline-none text-[15px] resize-none block leading-snug"
          style={{ color: 'var(--text-primary)', maxHeight: MAX_ROWS_PX }}
        />
      </div>

      {/* Voice / Send button */}
      {hasContent || editing ? (
        <motion.button
          type="submit"
          disabled={disabled || !hasContent}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--accent-gradient)' }}
        >
          {editing ? <Check size={20} className="text-white" /> : <Send size={18} className="text-white ml-0.5" />}
        </motion.button>
      ) : (
        <motion.button
          type="button"
          onClick={handleVoiceToggle}
          whileTap={{ scale: 0.9 }}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Mic size={20} />
        </motion.button>
      )}
    </form>
    </div>
    </>
  );
}
