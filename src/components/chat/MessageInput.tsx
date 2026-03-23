'use client';

import { useState, useRef, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Camera, Image as ImageIcon } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onPhoto?: (file: File) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onPhoto, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhoto) {
      onPhoto(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 safe-bottom"
      style={{
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Photo button */}
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
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Text input */}
      <div
        className="flex-1 rounded-3xl px-4 py-2.5 transition-all"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napiš zprávu..."
          disabled={disabled}
          className="w-full bg-transparent outline-none text-[15px]"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Send button */}
      <motion.button
        type="submit"
        disabled={!hasContent || disabled}
        whileTap={{ scale: 0.9 }}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: hasContent ? 'var(--accent-gradient)' : 'var(--accent-soft)',
          opacity: hasContent ? 1 : 0.5,
        }}
      >
        <Send size={18} className="text-white ml-0.5" />
      </motion.button>
    </form>
  );
}
