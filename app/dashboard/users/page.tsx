'use client';

import React, { useState, useEffect } from 'react';
import { DbRepository } from '@/lib/database/repository';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { Users, User as UserIcon, RefreshCw, Bell, CheckCircle2 } from 'lucide-react';

export default function UsersPage() {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await DbRepository.getTopUsers(50);
      setTopUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <div className="space-y-6 font-body">
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
            REMINDLY OWNER DASHBOARD
          </span>
          <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
            <Users className="text-[#EF4444]" /> USER ADOPTION DIRECTORY
          </h1>
          <p className="font-body text-sm text-[#A3A3A3] mt-1">
            Track user adoption, Telegram profiles, reminder volume, and active usage.
          </p>
        </div>

        <button
          onClick={loadUserData}
          className="vb-btn-secondary text-xs py-2 px-4 flex items-center gap-2 border-[#FAFAFA] text-[#FAFAFA] hover:bg-[#FAFAFA] hover:text-[#0A0A0A]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> REFRESH USERS
        </button>
      </div>

      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6">
        {loading ? (
          <div className="p-8 font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-[#EF4444]" /> LOADING USERS DIRECTORY...
          </div>
        ) : topUsers.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-[#D4D4D4] font-mono text-xs text-[#737373] uppercase">
            No users recorded yet. Users who message Remindly on Telegram will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-2 border-[#0A0A0A]">
              <thead className="bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-r-2 border-[#333333]">User</th>
                  <th className="p-3 border-r-2 border-[#333333]">Telegram Username</th>
                  <th className="p-3 border-r-2 border-[#333333]">Telegram User ID</th>
                  <th className="p-3 border-r-2 border-[#333333]">Timezone</th>
                  <th className="p-3 border-r-2 border-[#333333]">Reminders Created</th>
                  <th className="p-3 border-r-2 border-[#333333]">Reminders Delivered</th>
                  <th className="p-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0A0A0A]">
                {topUsers.map((item) => {
                  const u = item.user;
                  return (
                    <tr key={u.id} className="hover:bg-[#F5F5F5]">
                      <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5] flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-xs">
                          <UserIcon size={14} />
                        </div>
                        {u.display_name}
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-[#EF4444] border-r-2 border-[#E5E5E5]">
                        {u.telegram_username ? `@${u.telegram_username}` : 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-xs text-[#0A0A0A] border-r-2 border-[#E5E5E5]">
                        {u.telegram_user_id}
                      </td>
                      <td className="p-3 font-mono text-xs text-[#525252] border-r-2 border-[#E5E5E5]">
                        {u.timezone}
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5]">
                        <span className="inline-flex items-center gap-1">
                          <Bell size={12} className="text-[#EF4444]" /> {item.totalReminders}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-[#16A34A] border-r-2 border-[#E5E5E5]">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {item.sentReminders}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-[#525252]">
                        {formatLocalDateTime(item.lastActive)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
