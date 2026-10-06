'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  ShieldCheck,
  RefreshCw,
  Zap,
  BarChart2,
  PieChart,
  UserCheck,
} from 'lucide-react';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [growthPeriod, setGrowthPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/analytics?growthPeriod=${growthPeriod}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [growthPeriod]);

  const handleRunScheduler = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/demo/trigger-reminder', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setTriggerResult(
          `Processed ${json.result.processed} due instances (${json.result.success} sent, ${json.result.failed} failed)`
        );
        fetchDashboardData();
      } else {
        setTriggerResult(`Error: ${json.error}`);
      }
    } catch (e) {
      setTriggerResult('Failed to execute scheduler');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-3">
        <RefreshCw size={16} className="animate-spin text-[#EF4444]" /> LOADING REMINDLY OWNER ANALYTICS...
      </div>
    );
  }

  const overview = data?.overview || {
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalReminders: 0,
    scheduledReminders: 0,
    sentReminders: 0,
    failedReminders: 0,
    cancelledReminders: 0,
    groupChats: 0,
    privateChats: 0,
    privateReminders: 0,
    groupReminders: 0,
    deliverySuccessRate: 100,
  };

  const userGrowth = data?.userGrowth || [];
  const reminderActivity = data?.reminderActivity || [];
  const topUsers = data?.topUsers || [];
  const topGroups = data?.topGroups || [];
  const recentActivity = data?.recentActivity || [];
  const reliability = data?.reliability || {
    totalAttempted: 0,
    totalSent: 0,
    totalFailed: 0,
    pendingScheduled: 0,
    successRate: 100,
    schedulerStatus: 'ACTIVE',
    recentFailures: [],
  };

  const totalR = overview.totalReminders || 1; // Prevent division by zero
  const pctScheduled = Math.round(((overview.scheduledReminders || 0) / totalR) * 100);
  const pctSent = Math.round(((overview.sentReminders || 0) / totalR) * 100);
  const pctCancelled = Math.round(((overview.cancelledReminders || 0) / totalR) * 100);
  const pctFailed = Math.round(((overview.failedReminders || 0) / totalR) * 100);

  return (
    <div className="space-y-8 font-body">
      {/* Owner Header */}
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            REMINDLY OWNER ANALYTICS
          </span>
          <h1 className="font-display text-3xl md:text-4xl uppercase text-[#FAFAFA] tracking-tight">
            PRODUCT & USAGE DASHBOARD
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Understand adoption, usage, reminders, and reliability in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="vb-btn-secondary text-xs py-2 px-4 flex items-center gap-2 border-[#FAFAFA] text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING...' : 'REFRESH DATA'}
          </button>
          <button
            onClick={handleRunScheduler}
            disabled={triggering}
            className="vb-btn-primary bg-[#EF4444] border-[#EF4444] text-xs py-2 px-4 flex items-center gap-2 hover:bg-[#DC2626]"
          >
            <Zap size={14} className={triggering ? 'animate-spin' : ''} />
            {triggering ? 'EXECUTING...' : 'TEST SCHEDULER'}
          </button>
        </div>
      </div>

      {triggerResult && (
        <div className="p-4 bg-[#0A0A0A] text-[#FAFAFA] border-l-4 border-[#EF4444] font-mono text-xs font-bold uppercase flex items-center gap-2">
          <Zap size={16} className="text-[#EF4444]" /> {triggerResult}
        </div>
      )}

      {/* TOP 8 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#525252] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>TOTAL USERS</span>
            <Users size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A]">{overview.totalUsers}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#525252] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>ACTIVE USERS</span>
            <UserCheck size={14} className="text-[#16A34A]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#16A34A]">{overview.activeUsers}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#525252] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>TOTAL CHATS</span>
            <MessageSquare size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A]">{overview.totalChats}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#525252] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>REMINDERS</span>
            <Bell size={14} className="text-[#0A0A0A]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A]">{overview.totalReminders}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#CA8A04] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>SCHEDULED</span>
            <Clock size={14} className="text-[#CA8A04]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#CA8A04]">{overview.scheduledReminders}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#16A34A] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>SENT</span>
            <CheckCircle size={14} className="text-[#16A34A]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#16A34A]">{overview.sentReminders}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>FAILED</span>
            <AlertCircle size={14} className="text-[#EF4444]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#EF4444]">{overview.failedReminders}</div>
        </div>

        <div className="bg-[#FAFAFA] border-2 border-[#0A0A0A] p-4 text-left">
          <div className="font-mono text-[10px] font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center justify-between mb-1">
            <span>GROUPS</span>
            <Users size={14} className="text-[#EF4444]" />
          </div>
          <div className="font-display text-3xl font-bold text-[#0A0A0A]">{overview.groupChats}</div>
        </div>
      </div>

      {/* CHARTS GRID: User Growth & Reminder Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-widest block">
                ADOPTION METRICS
              </span>
              <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
                <TrendingUp size={18} className="text-[#EF4444]" /> USER GROWTH OVER TIME
              </h2>
            </div>

            <div className="flex items-center bg-[#E5E5E5] p-1 border-2 border-[#0A0A0A]">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setGrowthPeriod(p)}
                  className={`px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase transition-all ${
                    growthPeriod === p
                      ? 'bg-[#0A0A0A] text-[#FAFAFA]'
                      : 'text-[#525252] hover:text-[#0A0A0A]'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {userGrowth.length === 0 ? (
            <div className="h-48 border-2 border-dashed border-[#D4D4D4] flex flex-col items-center justify-center font-mono text-xs text-[#737373] uppercase">
              <Users size={24} className="mb-2 text-[#A3A3A3]" /> No user activity yet.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {userGrowth.map((pt: any) => (
                <div key={pt.date} className="flex items-center gap-3 font-mono text-xs">
                  <span className="w-24 text-[#525252] font-bold">{pt.date}</span>
                  <div className="flex-1 bg-[#E5E5E5] h-5 relative overflow-hidden border border-[#0A0A0A]">
                    <div
                      className="bg-[#EF4444] h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (pt.count / Math.max(...userGrowth.map((g: any) => g.count))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 font-bold text-right text-[#0A0A0A]">{pt.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminder Activity Volume */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-widest block">
                USAGE METRICS
              </span>
              <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
                <BarChart2 size={18} className="text-[#EF4444]" /> REMINDER VOLUME OVER TIME
              </h2>
            </div>
          </div>

          {reminderActivity.length === 0 ? (
            <div className="h-48 border-2 border-dashed border-[#D4D4D4] flex flex-col items-center justify-center font-mono text-xs text-[#737373] uppercase">
              <Bell size={24} className="mb-2 text-[#A3A3A3]" /> No reminder activity yet.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {reminderActivity.map((pt: any) => (
                <div key={pt.date} className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#0A0A0A]">
                    <span>{pt.date}</span>
                    <span>{pt.created} created ({pt.sent} sent, {pt.failed} failed)</span>
                  </div>
                  <div className="flex h-4 border border-[#0A0A0A] overflow-hidden bg-[#E5E5E5]">
                    <div
                      className="bg-[#16A34A] h-full"
                      style={{ width: `${pt.created > 0 ? (pt.sent / pt.created) * 100 : 0}%` }}
                      title={`Sent: ${pt.sent}`}
                    />
                    <div
                      className="bg-[#CA8A04] h-full"
                      style={{
                        width: `${
                          pt.created > 0 ? ((pt.created - pt.sent - pt.failed - pt.cancelled) / pt.created) * 100 : 0
                        }%`,
                      }}
                      title="Scheduled"
                    />
                    <div
                      className="bg-[#EF4444] h-full"
                      style={{ width: `${pt.created > 0 ? (pt.failed / pt.created) * 100 : 0}%` }}
                      title={`Failed: ${pt.failed}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REMINDER STATUS BREAKDOWN & PRIVATE VS GROUP USAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-3 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
              <PieChart size={18} className="text-[#EF4444]" /> REMINDER STATUS BREAKDOWN
            </h2>
            <span className="font-mono text-xs font-bold text-[#525252]">TOTAL: {overview.totalReminders}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="border-2 border-[#CA8A04] bg-[#FEFCE8] p-3 font-mono">
              <div className="text-[10px] font-bold text-[#CA8A04] uppercase">SCHEDULED</div>
              <div className="text-2xl font-bold text-[#0A0A0A] mt-1">{overview.scheduledReminders}</div>
              <div className="text-[11px] text-[#525252]">{pctScheduled}% of total</div>
            </div>

            <div className="border-2 border-[#16A34A] bg-[#F0FDF4] p-3 font-mono">
              <div className="text-[10px] font-bold text-[#16A34A] uppercase">DELIVERED / SENT</div>
              <div className="text-2xl font-bold text-[#0A0A0A] mt-1">{overview.sentReminders}</div>
              <div className="text-[11px] text-[#525252]">{pctSent}% of total</div>
            </div>

            <div className="border-2 border-[#525252] bg-[#F5F5F5] p-3 font-mono">
              <div className="text-[10px] font-bold text-[#525252] uppercase">CANCELLED</div>
              <div className="text-2xl font-bold text-[#0A0A0A] mt-1">{overview.cancelledReminders}</div>
              <div className="text-[11px] text-[#525252]">{pctCancelled}% of total</div>
            </div>

            <div className="border-2 border-[#EF4444] bg-[#FEF2F2] p-3 font-mono">
              <div className="text-[10px] font-bold text-[#EF4444] uppercase">FAILED</div>
              <div className="text-2xl font-bold text-[#0A0A0A] mt-1">{overview.failedReminders}</div>
              <div className="text-[11px] text-[#525252]">{pctFailed}% of total</div>
            </div>
          </div>
        </div>

        {/* Private vs Group Usage */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-3">
            <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
              <MessageSquare size={18} className="text-[#EF4444]" /> PRIVATE VS GROUP USAGE
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 font-mono">
            <div className="border-2 border-[#0A0A0A] p-4 bg-[#FAFAFA]">
              <div className="text-xs font-bold text-[#737373] uppercase">PRIVATE CHATS</div>
              <div className="text-3xl font-bold text-[#0A0A0A] my-1">{overview.privateChats}</div>
              <div className="text-xs text-[#525252]">
                Reminders created: <span className="font-bold text-[#0A0A0A]">{overview.privateReminders}</span>
              </div>
            </div>

            <div className="border-2 border-[#0A0A0A] p-4 bg-[#FAFAFA]">
              <div className="text-xs font-bold text-[#EF4444] uppercase">GROUP CHATS</div>
              <div className="text-3xl font-bold text-[#0A0A0A] my-1">{overview.groupChats}</div>
              <div className="text-xs text-[#525252]">
                Reminders created: <span className="font-bold text-[#0A0A0A]">{overview.groupReminders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP USERS & TOP GROUPS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Users */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-3">
            <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
              <Users size={18} className="text-[#EF4444]" /> MOST ACTIVE USERS
            </h2>
          </div>

          {topUsers.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase text-center">
              No users recorded yet.
            </div>
          ) : (
            <div className="divide-y-2 border-2 border-[#0A0A0A]">
              {topUsers.map((item: any) => (
                <div key={item.user.id} className="p-3 flex items-center justify-between font-mono text-xs bg-[#FAFAFA] hover:bg-[#F5F5F5]">
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{item.user.display_name}</div>
                    <div className="text-[10px] text-[#737373]">
                      @{item.user.telegram_username || 'no_username'} • Joined {formatLocalDateTime(item.user.created_at, 'Asia/Kolkata', 'MMM d')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#EF4444]">{item.totalReminders} reminders</div>
                    <div className="text-[10px] text-[#16A34A]">{item.sentReminders} delivered</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Active Groups */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-3">
            <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
              <Users size={18} className="text-[#EF4444]" /> MOST ACTIVE GROUPS
            </h2>
          </div>

          {topGroups.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase text-center">
              No group chats connected yet.
            </div>
          ) : (
            <div className="divide-y-2 border-2 border-[#0A0A0A]">
              {topGroups.map((item: any) => (
                <div key={item.chat.id} className="p-3 flex items-center justify-between font-mono text-xs bg-[#FAFAFA] hover:bg-[#F5F5F5]">
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{item.chat.chat_title}</div>
                    <div className="text-[10px] text-[#737373]">ID: {item.chat.telegram_chat_id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#EF4444]">{item.totalReminders} reminders</div>
                    <div className="text-[10px] text-[#16A34A]">{item.sentReminders} delivered</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM RELIABILITY & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reliability Card */}
        <div className="bg-[#0A0A0A] text-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4 lg:col-span-1">
          <div className="border-b-2 border-[#333333] pb-3">
            <span className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-widest block">
              DIAGNOSTICS & SLA
            </span>
            <h2 className="font-display text-2xl uppercase text-[#FAFAFA] flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#16A34A]" /> SYSTEM RELIABILITY
            </h2>
          </div>

          <div className="space-y-4 font-mono">
            <div className="p-4 bg-[#171717] border-2 border-[#333333]">
              <div className="text-xs text-[#A3A3A3] uppercase">DELIVERY SUCCESS RATE</div>
              <div className="text-4xl font-bold text-[#16A34A] my-1">{reliability.successRate}%</div>
              <div className="text-[10px] text-[#737373]">
                {reliability.totalSent} delivered / {reliability.totalAttempted} attempted
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#171717] border-2 border-[#333333]">
                <div className="text-[#A3A3A3] text-[10px] uppercase">PENDING</div>
                <div className="text-xl font-bold text-[#CA8A04] mt-0.5">{reliability.pendingScheduled}</div>
              </div>
              <div className="p-3 bg-[#171717] border-2 border-[#333333]">
                <div className="text-[#A3A3A3] text-[10px] uppercase">FAILURES</div>
                <div className="text-xl font-bold text-[#EF4444] mt-0.5">{reliability.totalFailed}</div>
              </div>
            </div>

            <div className="p-3 bg-[#171717] border-2 border-[#333333] text-xs">
              <div className="text-[#A3A3A3] text-[10px] uppercase mb-1">SCHEDULER STATUS</div>
              <div className="flex items-center gap-2 font-bold text-[#16A34A]">
                <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-full animate-pulse" />
                {reliability.schedulerStatus} // READY
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4 lg:col-span-2">
          <div className="border-b-2 border-[#0A0A0A] pb-3 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
              <Activity size={18} className="text-[#EF4444]" /> RECENT ACTIVITY FEED
            </h2>
            <span className="font-mono text-[10px] font-bold text-[#737373] uppercase">LIVE STREAM</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase text-center">
              No recent activity recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((evt: any) => (
                <div key={evt.id} className="p-3 border-2 border-[#0A0A0A] bg-[#FAFAFA] flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-[#0A0A0A] text-[#FAFAFA] text-[9px] font-bold uppercase">
                      {evt.type.replace('_', ' ')}
                    </span>
                    <div>
                      <div className="font-bold text-[#0A0A0A]">
                        {evt.reminder_title ? `📌 ${evt.reminder_title}` : evt.chat_title || 'Activity'}
                      </div>
                      <div className="text-[10px] text-[#737373]">
                        {evt.user_name} • {evt.chat_title}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[#525252]">
                    {formatLocalDateTime(evt.timestamp, 'Asia/Kolkata', 'h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
