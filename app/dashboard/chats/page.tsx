'use client';

import React, { useState, useEffect } from 'react';
import { DbRepository } from '@/lib/database/repository';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { MessageSquare, Users, User as UserIcon, RefreshCw, Bell, CheckCircle2 } from 'lucide-react';

export default function ConnectedChatsPage() {
  const [topGroups, setTopGroups] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChatData = async () => {
    try {
      setLoading(true);
      const [allChats, groupsData] = await Promise.all([
        DbRepository.getChats(),
        DbRepository.getTopGroups(50),
      ]);
      setChats(allChats);
      setTopGroups(groupsData);
    } catch (e) {
      console.error('Failed to load chats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatData();
  }, []);

  const privateChats = chats.filter((c) => c.chat_type === 'private');
  const groupChats = chats.filter((c) => c.chat_type === 'group' || c.chat_type === 'supergroup');

  return (
    <div className="space-y-6 font-body">
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            REMINDLY OWNER DASHBOARD
          </span>
          <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
            <MessageSquare className="text-[#EF4444]" /> CONNECTED CHATS & GROUPS
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Monitor private conversations and team group chat commitments across Telegram.
          </p>
        </div>

        <button
          onClick={loadChatData}
          className="vb-btn-secondary text-xs py-2 px-4 flex items-center gap-2 border-[#FAFAFA] text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH CHATS
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-4">
          <div className="font-mono text-xs font-bold text-[#737373] uppercase">TOTAL CONNECTED CHATS</div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A] mt-1">{chats.length}</div>
        </div>

        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-4">
          <div className="font-mono text-xs font-bold text-[#0A0A0A] uppercase">PRIVATE CHATS</div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A] mt-1">{privateChats.length}</div>
        </div>

        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-4">
          <div className="font-mono text-xs font-bold text-[#EF4444] uppercase">GROUP CHATS</div>
          <div className="font-display text-3xl font-bold text-[#EF4444] mt-1">{groupChats.length}</div>
        </div>
      </div>

      {/* Connected Chats Directory */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
        <div className="border-b-2 border-[#0A0A0A] pb-3">
          <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
            <Users size={18} className="text-[#EF4444]" /> CHATS & GROUPS DIRECTORY
          </h2>
        </div>

        {loading ? (
          <div className="p-8 font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-[#EF4444]" /> LOADING CHATS DIRECTORY...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase">
            No connected chats recorded yet. Remindly will list Telegram chats automatically when invoked.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chats.map((c) => {
              const isGroup = c.chat_type !== 'private';
              return (
                <div key={c.id} className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold border-2 border-[#0A0A0A] shrink-0">
                        {isGroup ? <Users size={18} /> : <UserIcon size={18} />}
                      </div>
                      <div>
                        <h3 className="font-display text-base uppercase text-[#0A0A0A] line-clamp-1">
                          {c.chat_title || 'Telegram Chat'}
                        </h3>
                        <span className="font-mono text-[10px] text-[#737373]">ID: {c.telegram_chat_id}</span>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-0.5 border uppercase ${
                        isGroup ? 'bg-[#EF4444] text-[#FAFAFA] border-[#EF4444]' : 'bg-[#0A0A0A] text-[#FAFAFA] border-[#0A0A0A]'
                      }`}
                    >
                      {c.chat_type}
                    </span>
                  </div>

                  <div className="pt-2 border-t-2 border-[#E5E5E5] flex items-center justify-between font-mono text-xs text-[#525252]">
                    <span>TZ: {c.timezone}</span>
                    <span>CONNECTED: {formatLocalDateTime(c.created_at, c.timezone, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
