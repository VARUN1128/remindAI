'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Bot, RefreshCw, CheckCircle2, AlertTriangle, MessageSquare, Clock } from 'lucide-react';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';

export default function ActivityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivityData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch activity data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-3">
        <RefreshCw size={16} className="animate-spin text-[#EF4444]" /> LOADING ACTIVITY LOGS & INTENT METRICS...
      </div>
    );
  }

  const aiMetrics = data?.aiMetrics || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#0A0A0A] pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest mb-1">
            <Activity size={14} /> SYSTEM ACTIVITY & INTENT AUDIT
          </div>
          <h1 className="font-display text-3xl md:text-4xl uppercase tracking-tight text-[#0A0A0A]">
            AGENT & LOG ACTIVITY
          </h1>
          <p className="font-body text-sm text-[#525252] mt-1">
            Track message processing, AI intent distribution, and Telegram delivery events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActivityData}
            disabled={refreshing}
            className="vb-btn-secondary text-xs py-2 px-4 flex items-center gap-2"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING...' : 'REFRESH LOGS'}
          </button>
        </div>
      </div>

      {/* AI Intent Metrics Breakdown */}
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-3 flex items-center gap-2">
          <Bot size={14} className="text-[#EF4444]" /> AI INTENT CLASSIFICATION METRICS
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {aiMetrics.map((item: any) => (
            <div key={item.intent} className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-3 text-center">
              <div className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider truncate">
                {item.intent.replace('_REMINDER', '').replace('_', ' ')}
              </div>
              <div className="font-display text-2xl font-bold text-[#0A0A0A] mt-1">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent System Logs Table */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
            <Clock size={16} className="text-[#EF4444]" /> REAL-TIME ACTIVITY & DELIVERY EVENTS
          </div>
          <span className="font-mono text-[10px] font-bold text-[#737373] uppercase">
            {recentActivity.length} EVENTS RECORDED
          </span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase">
            No activity logs recorded yet. Reminders created via Telegram will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-[#0A0A0A] font-mono text-[10px] text-[#737373] uppercase">
                  <th className="py-2.5 px-3">EVENT TYPE</th>
                  <th className="py-2.5 px-3">ACTOR / CHAT</th>
                  <th className="py-2.5 px-3">TITLE / DETAILS</th>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-[#0A0A0A]">
                {recentActivity.map((evt: any) => (
                  <tr key={evt.id} className="hover:bg-[#F5F5F5]">
                    <td className="py-3 px-3 font-mono font-bold text-[#0A0A0A] uppercase">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#0A0A0A] text-[#FAFAFA] text-[10px]">
                        {evt.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-[#0A0A0A]">{evt.user_name || 'User'}</div>
                      <div className="text-[10px] text-[#737373]">{evt.chat_title || 'Chat'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#0A0A0A]">
                      {evt.reminder_title ? <span>📌 {evt.reminder_title}</span> : <span className="text-[#737373]">-</span>}
                      {evt.details && <div className="text-[10px] text-[#EF4444] mt-0.5">⚠️ {evt.details}</div>}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#525252]">
                      {formatLocalDateTime(evt.timestamp)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {evt.status === 'sent' || evt.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-bold text-[10px] uppercase">
                          <CheckCircle2 size={12} /> DELIVERED
                        </span>
                      ) : evt.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[#EF4444] font-bold text-[10px] uppercase">
                          <AlertTriangle size={12} /> FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#0A0A0A] font-bold text-[10px] uppercase">
                          ● {evt.status || 'SCHEDULED'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
