'use client';

import React, { useState, useEffect } from 'react';
import { DbRepository } from '@/lib/database/repository';
import { Chat } from '@/types';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { MessageSquare, Users, User } from 'lucide-react';

export default function ConnectedChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    DbRepository.getChats().then(setChats);
  }, []);

  return (
    <div className="space-y-6 font-body">
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A]">
        <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
          CHANNEL DIRECTORY // VOICEBOX SPEC
        </span>
        <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
          <MessageSquare className="text-[#EF4444]" /> CONNECTED TELEGRAM CHATS
        </h1>
        <p className="font-body text-sm text-[#A3A3A3] mt-1">
          Telegram private interactions and group/supergroup coordination channels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chats.map((c) => (
          <div key={c.id} className="vb-card-elevated space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold border-2 border-[#0A0A0A]">
                  {c.chat_type === 'private' ? <User size={20} /> : <Users size={20} />}
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase text-[#0A0A0A]">{c.chat_title || 'Telegram Chat'}</h3>
                  <span className="font-mono text-xs text-[#525252]">ID: {c.telegram_chat_id}</span>
                </div>
              </div>

              <span className="font-mono text-[11px] font-bold px-3 py-1 bg-[#0A0A0A] text-[#FAFAFA] uppercase border-2 border-[#0A0A0A]">
                {c.chat_type}
              </span>
            </div>

            <div className="pt-3 border-t-2 border-[#0A0A0A] flex items-center justify-between font-mono text-xs text-[#525252]">
              <span>TIMEZONE: {c.timezone}</span>
              <span>CONNECTED: {formatLocalDateTime(c.created_at, c.timezone, 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
