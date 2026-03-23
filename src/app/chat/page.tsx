'use client';

import { ChatView } from '@/components/chat/ChatView';
import { BottomNav } from '@/components/ui/BottomNav';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-dvh">
      <ChatView />
      <BottomNav />
    </div>
  );
}
