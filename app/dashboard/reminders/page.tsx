'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { DbRepository } from '@/lib/database/repository';
import { Reminder } from '@/types';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { Calendar, Search, Users, User } from 'lucide-react';

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [search, setSearch] = useState<string>('');

  const loadReminders = async () => {
    let r: Reminder[];
    if (user && scope === 'my') {
      r = await DbRepository.getRemindersByUser(user.id);
    } else {
      r = await DbRepository.getReminders();
    }
    setReminders(r);
  };

  useEffect(() => {
    loadReminders();
  }, [user, scope]);

  const handleCancel = async (id: string) => {
    await DbRepository.cancelReminder(id);
    loadReminders();
  };

  const filtered = reminders.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            COMMITMENT DATABASE // VOICEBOX SPEC
          </span>
          <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
            <Calendar className="text-[#EF4444]" /> REMINDERS DATABASE
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Browse, search, and manage scheduled commitments across all Telegram chats.
          </p>
        </div>

        {/* VoiceBox Scope and Filter Chips */}
        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <div className="flex items-center bg-[#171717] p-1 border-2 border-[#333333]">
              <button
                onClick={() => setScope('my')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                  scope === 'my'
                    ? 'bg-[#EF4444] text-[#FAFAFA]'
                    : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                }`}
              >
                MY REMINDERS
              </button>
              <button
                onClick={() => setScope('all')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                  scope === 'all'
                    ? 'bg-[#EF4444] text-[#FAFAFA]'
                    : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                }`}
              >
                ALL SYSTEM
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {['all', 'scheduled', 'sent', 'cancelled', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`vb-chip ${filter === f ? 'vb-chip-selected' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input - VoiceBox Style */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A0A0A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH REMINDER TITLE..."
          className="vb-input pl-12 font-mono uppercase font-bold text-xs"
        />
      </div>

      {/* Reminders Table */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-2 border-[#0A0A0A]">
            <thead className="bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 border-r-2 border-[#333333]">Title</th>
                <th className="p-3 border-r-2 border-[#333333]">Chat / Target</th>
                <th className="p-3 border-r-2 border-[#333333]">Event Time</th>
                <th className="p-3 border-r-2 border-[#333333]">Reminder Time</th>
                <th className="p-3 border-r-2 border-[#333333]">Recurrence</th>
                <th className="p-3 border-r-2 border-[#333333]">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0A0A0A]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#F5F5F5]">
                  <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">{r.title}</td>
                  <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5] flex items-center gap-1.5 font-bold">
                    {r.chat?.chat_type === 'private' ? <User size={14} /> : <Users size={14} />}
                    {r.chat?.chat_title || 'Chat'}
                  </td>
                  <td className="p-3 font-mono text-xs text-[#525252] border-r-2 border-[#E5E5E5]">
                    {r.event_time ? formatLocalDateTime(r.event_time, r.timezone) : '—'}
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">
                    {formatLocalDateTime(r.reminder_time, r.timezone)}
                  </td>
                  <td className="p-3 font-mono text-xs uppercase text-[#525252] border-r-2 border-[#E5E5E5]">
                    {r.recurrence_type}
                  </td>
                  <td className="p-3 border-r-2 border-[#E5E5E5]">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 border-2 uppercase ${
                        r.status === 'scheduled'
                          ? 'bg-[#FEFCE8] text-[#CA8A04] border-[#CA8A04]'
                          : r.status === 'sent'
                          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]'
                          : 'bg-[#F5F5F5] text-[#525252] border-[#525252]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {r.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="vb-btn-destructive text-xs py-1 px-3 uppercase"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-xs text-[#525252] uppercase italic">
                    No reminders found matching active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
