'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { DbRepository } from '@/lib/database/repository';
import { Reminder } from '@/types';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { Calendar, Search, Users, User as UserIcon, X, Info, Clock, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [search, setSearch] = useState<string>('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

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
    if (search) {
      const q = search.toLowerCase();
      const titleMatch = r.title.toLowerCase().includes(q);
      const userMatch = (r.created_by?.display_name || '').toLowerCase().includes(q);
      const chatMatch = (r.chat?.chat_title || '').toLowerCase().includes(q);
      if (!titleMatch && !userMatch && !chatMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            REMINDLY OWNER DASHBOARD
          </span>
          <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
            <Calendar className="text-[#EF4444]" /> REMINDERS DATABASE & DEBUGGER
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Search, filter, inspect AI time-resolution details, and manage production reminders.
          </p>
        </div>

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
                className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 transition-all ${
                  filter === f
                    ? 'bg-[#EF4444] text-[#FAFAFA] border-[#EF4444]'
                    : 'bg-[#FAFAFA] text-[#0A0A0A] border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAFA]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A0A0A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH BY TITLE, USER, OR CHAT NAME..."
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
                <th className="p-3 border-r-2 border-[#333333]">User</th>
                <th className="p-3 border-r-2 border-[#333333]">Chat / Target</th>
                <th className="p-3 border-r-2 border-[#333333]">Type</th>
                <th className="p-3 border-r-2 border-[#333333]">Created At</th>
                <th className="p-3 border-r-2 border-[#333333]">Scheduled For</th>
                <th className="p-3 border-r-2 border-[#333333]">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0A0A0A]">
              {filtered.map((r) => {
                const isGroup = r.chat?.chat_type !== 'private';
                return (
                  <tr key={r.id} className="hover:bg-[#F5F5F5]">
                    <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">{r.title}</td>
                    <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5] font-mono text-xs">
                      {r.created_by?.display_name || 'User'}
                    </td>
                    <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5] font-mono text-xs font-bold">
                      {r.chat?.chat_title || 'Chat'}
                    </td>
                    <td className="p-3 border-r-2 border-[#E5E5E5]">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-[#0A0A0A] bg-[#0A0A0A] text-[#FAFAFA] uppercase">
                        {isGroup ? <Users size={10} /> : <UserIcon size={10} />}
                        {isGroup ? 'GROUP' : 'PRIVATE'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#525252] border-r-2 border-[#E5E5E5]">
                      {formatLocalDateTime(r.created_at, r.timezone, 'MMM d, h:mm a')}
                    </td>
                    <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">
                      {formatLocalDateTime(r.reminder_time, r.timezone, 'MMM d, h:mm a')}
                    </td>
                    <td className="p-3 border-r-2 border-[#E5E5E5]">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 border-2 uppercase ${
                          r.status === 'scheduled'
                            ? 'bg-[#FEFCE8] text-[#CA8A04] border-[#CA8A04]'
                            : r.status === 'sent'
                            ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]'
                            : r.status === 'cancelled'
                            ? 'bg-[#F5F5F5] text-[#525252] border-[#525252]'
                            : 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedReminder(r)}
                        className="px-2.5 py-1 bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs font-bold uppercase hover:bg-[#EF4444] transition-all flex items-center gap-1"
                      >
                        <Info size={12} /> Inspect
                      </button>
                      {r.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="vb-btn-destructive text-xs py-1 px-2.5 uppercase"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center font-mono text-xs text-[#525252] uppercase italic">
                    No reminders found matching active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEBUG / DETAIL VIEW MODAL */}
      {selectedReminder && (
        <div className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] max-w-2xl w-full p-6 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b-4 border-[#0A0A0A] pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-widest block">
                  AI & SCHEDULER DEBUG ENGINE
                </span>
                <h2 className="font-display text-2xl uppercase text-[#0A0A0A]">REMINDER DETAIL INSPECTOR</h2>
              </div>
              <button
                onClick={() => setSelectedReminder(null)}
                className="p-1.5 bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#EF4444] border-2 border-[#0A0A0A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#0A0A0A] text-[#FAFAFA] border-2 border-[#0A0A0A] space-y-2">
                <div className="text-[10px] font-bold text-[#EF4444] uppercase">REMINDER TITLE</div>
                <div className="font-display text-2xl uppercase text-[#FAFAFA]">{selectedReminder.title}</div>
                {selectedReminder.description && (
                  <div className="text-xs text-[#A3A3A3] pt-1">{selectedReminder.description}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA]">
                  <div className="text-[10px] font-bold text-[#737373] uppercase">CREATED BY</div>
                  <div className="font-bold text-[#0A0A0A] mt-0.5">
                    {selectedReminder.created_by?.display_name || 'User'}
                  </div>
                </div>

                <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA]">
                  <div className="text-[10px] font-bold text-[#737373] uppercase">TARGET CHAT</div>
                  <div className="font-bold text-[#0A0A0A] mt-0.5">
                    {selectedReminder.chat?.chat_title || 'Chat'} ({selectedReminder.chat?.chat_type.toUpperCase()})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA]">
                  <div className="text-[10px] font-bold text-[#737373] uppercase">CONFIGURED TIMEZONE</div>
                  <div className="font-bold text-[#0A0A0A] mt-0.5">{selectedReminder.timezone}</div>
                </div>

                <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA]">
                  <div className="text-[10px] font-bold text-[#737373] uppercase">RECURRENCE RULE</div>
                  <div className="font-bold text-[#0A0A0A] mt-0.5 uppercase">{selectedReminder.recurrence_type}</div>
                </div>
              </div>

              <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA] space-y-2">
                <div className="text-[10px] font-bold text-[#EF4444] uppercase">ISO TIMESTAMP & RESOLVED LOCAL TIME</div>
                <div className="text-[11px] text-[#525252]">
                  <span className="font-bold text-[#0A0A0A]">ISO 8601 String:</span> {selectedReminder.reminder_time}
                </div>
                <div className="text-[11px] text-[#525252]">
                  <span className="font-bold text-[#0A0A0A]">Resolved Local Display:</span>{' '}
                  {formatLocalDateTime(selectedReminder.reminder_time, selectedReminder.timezone)}
                </div>
                <div className="text-[11px] text-[#525252]">
                  <span className="font-bold text-[#0A0A0A]">Created Timestamp:</span>{' '}
                  {formatLocalDateTime(selectedReminder.created_at, selectedReminder.timezone)}
                </div>
              </div>

              <div className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA] flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#737373] uppercase">STATUS</div>
                  <div className="font-bold text-[#0A0A0A] uppercase mt-0.5">{selectedReminder.status}</div>
                </div>
                {selectedReminder.status === 'sent' && (
                  <span className="inline-flex items-center gap-1 font-bold text-[#16A34A] text-xs">
                    <CheckCircle2 size={14} /> DELIVERED
                  </span>
                )}
                {selectedReminder.status === 'failed' && (
                  <span className="inline-flex items-center gap-1 font-bold text-[#EF4444] text-xs">
                    <AlertTriangle size={14} /> FAILED
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReminder(null)}
                className="vb-btn-secondary py-2 px-4 text-xs uppercase"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
