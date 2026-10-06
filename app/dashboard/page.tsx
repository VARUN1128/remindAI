'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { DbRepository } from '@/lib/database/repository';
import { Reminder, ReminderLog, Chat, User } from '@/types';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import {
  Users,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  User as UserIcon,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      const u = await DbRepository.getUsers();
      const c = await DbRepository.getChats();
      const l = await DbRepository.getLogs();

      let r: Reminder[];
      if (user && viewScope === 'my') {
        r = await DbRepository.getRemindersByUser(user.id);
      } else {
        r = await DbRepository.getReminders();
      }

      setUsers(u);
      setChats(c);
      setReminders(r);
      setLogs(l);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, viewScope]);

  const handleTriggerCron = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/demo/trigger-reminder', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTriggerResult(
          `Processed ${data.result.processed} due instances (${data.result.success} delivered, ${data.result.failed} failed)`
        );
        loadDashboardData();
      } else {
        setTriggerResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setTriggerResult('Failed to execute trigger');
    } finally {
      setTriggering(false);
    }
  };

  const handleReSeed = async () => {
    await fetch('/api/demo/trigger-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed' }),
    });
    loadDashboardData();
  };

  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const sentCount = reminders.filter((r) => r.status === 'sent').length;
  const cancelledCount = reminders.filter((r) => r.status === 'cancelled').length;
  const failedCount = reminders.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-8 font-body">
      {/* VoiceBox Top Header Banner */}
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            {user ? `WELCOME BACK // ${user.display_name.toUpperCase()}` : 'EDITORIAL MONITOR // VOICEBOX SPEC'}
          </span>
          <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight">
            {viewScope === 'my' && user ? 'MY PERSONAL DASHBOARD' : 'SYSTEM OVERVIEW & AUDIT'}
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Real-time metric monitoring, commitment tracking, and scheduler engine execution logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user && (
            <div className="flex items-center bg-[#171717] p-1 border-2 border-[#333333]">
              <button
                onClick={() => setViewScope('my')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                  viewScope === 'my'
                    ? 'bg-[#EF4444] text-[#FAFAFA]'
                    : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                }`}
              >
                MY REMINDERS
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-3 py-1 text-xs font-mono font-bold uppercase transition-all ${
                  viewScope === 'all'
                    ? 'bg-[#EF4444] text-[#FAFAFA]'
                    : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                }`}
              >
                ALL SYSTEM
              </button>
            </div>
          )}

          <button
            onClick={handleTriggerCron}
            disabled={triggering}
            className="vb-btn-primary bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626] hover:border-[#DC2626]"
          >
            <Play size={14} className={triggering ? 'animate-spin' : ''} />
            {triggering ? 'EXECUTING CRON...' : 'RUN SCHEDULER'}
          </button>
          <button onClick={handleReSeed} className="vb-btn-secondary text-[#FAFAFA] border-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]">
            <RotateCcw size={14} /> SEED DEMO DATA
          </button>
        </div>
      </div>

      {triggerResult && (
        <div className="p-4 bg-[#0A0A0A] text-[#FAFAFA] border-l-4 border-[#EF4444] font-mono text-xs font-bold uppercase flex items-center gap-2">
          <Zap size={16} className="text-[#EF4444]" /> {triggerResult}
        </div>
      )}

      {/* Metrics Cards Grid - VoiceBox Elevated Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#525252] mb-2 font-mono text-xs font-bold uppercase">
            <span>USERS</span>
            <Users size={16} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl text-[#0A0A0A]">{users.length}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#525252] mb-2 font-mono text-xs font-bold uppercase">
            <span>CHATS</span>
            <MessageSquare size={16} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl text-[#0A0A0A]">{chats.length}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#525252] mb-2 font-mono text-xs font-bold uppercase">
            <span>TOTAL</span>
            <Bell size={16} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl text-[#0A0A0A]">{reminders.length}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#CA8A04] mb-2 font-mono text-xs font-bold uppercase">
            <span>SCHEDULED</span>
            <Clock size={16} className="text-[#CA8A04]" />
          </div>
          <div className="font-display text-3xl text-[#CA8A04]">{scheduledCount}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#16A34A] mb-2 font-mono text-xs font-bold uppercase">
            <span>SENT</span>
            <CheckCircle size={16} className="text-[#16A34A]" />
          </div>
          <div className="font-display text-3xl text-[#16A34A]">{sentCount}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#525252] mb-2 font-mono text-xs font-bold uppercase">
            <span>CANCELLED</span>
            <XCircle size={16} className="text-[#525252]" />
          </div>
          <div className="font-display text-3xl text-[#525252]">{cancelledCount}</div>
        </div>

        <div className="vb-card-elevated p-4">
          <div className="flex items-center justify-between text-[#EF4444] mb-2 font-mono text-xs font-bold uppercase">
            <span>FAILED</span>
            <AlertCircle size={16} className="text-[#EF4444]" />
          </div>
          <div className="font-display text-3xl text-[#EF4444]">{failedCount}</div>
        </div>
      </div>

      {/* Recent Reminders Table - VoiceBox Magazine Style */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
        <div className="border-b-2 border-[#0A0A0A] pb-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block">
              DATABASE SNAPSHOT
            </span>
            <h2 className="font-display text-2xl uppercase text-[#0A0A0A]">
              {viewScope === 'my' && user ? `MY COMMITMENTS (${user.display_name})` : 'RECENT COMMITMENTS'}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-2 border-[#0A0A0A]">
            <thead className="bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 border-r-2 border-[#333333]">Title</th>
                <th className="p-3 border-r-2 border-[#333333]">Chat Target</th>
                <th className="p-3 border-r-2 border-[#333333]">Created By</th>
                <th className="p-3 border-r-2 border-[#333333]">Event Time</th>
                <th className="p-3 border-r-2 border-[#333333]">Reminder Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0A0A0A]">
              {reminders.slice(0, 10).map((r) => (
                <tr key={r.id} className="hover:bg-[#F5F5F5] font-body">
                  <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">{r.title}</td>
                  <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5]">{r.chat?.chat_title || 'Chat'}</td>
                  <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5]">{r.created_by?.display_name || 'User'}</td>
                  <td className="p-3 font-mono text-xs text-[#525252] border-r-2 border-[#E5E5E5]">
                    {r.event_time ? formatLocalDateTime(r.event_time, r.timezone, 'MMM d, h:mm a') : '—'}
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">
                    {formatLocalDateTime(r.reminder_time, r.timezone, 'MMM d, h:mm a')}
                  </td>
                  <td className="p-3">
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
                </tr>
              ))}
              {reminders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-xs text-[#525252] uppercase italic">
                    No active commitments found for this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Audit Logs Feed */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
        <div className="border-b-2 border-[#0A0A0A] pb-3">
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block">
            AUDIT LOGS
          </span>
          <h2 className="font-display text-2xl uppercase text-[#0A0A0A]">DELIVERY HISTORY</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-2 border-[#0A0A0A]">
            <thead className="bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 border-r-2 border-[#333333]">Log ID</th>
                <th className="p-3 border-r-2 border-[#333333]">Telegram Chat ID</th>
                <th className="p-3 border-r-2 border-[#333333]">Sent Time</th>
                <th className="p-3 border-r-2 border-[#333333]">Status</th>
                <th className="p-3">Error Message</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0A0A0A] font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F5F5F5]">
                  <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5]">{log.id}</td>
                  <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">{log.telegram_chat_id}</td>
                  <td className="p-3 text-[#525252] border-r-2 border-[#E5E5E5]">{formatLocalDateTime(log.sent_at)}</td>
                  <td className="p-3 border-r-2 border-[#E5E5E5]">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 border-2 uppercase ${
                        log.delivery_status === 'success'
                          ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]'
                          : 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]'
                      }`}
                    >
                      {log.delivery_status}
                    </span>
                  </td>
                  <td className="p-3 text-[#525252]">{log.error_message || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
