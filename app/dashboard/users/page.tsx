'use client';

import React, { useState, useEffect } from 'react';
import { DbRepository } from '@/lib/database/repository';
import { User as UserType } from '@/types';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';
import { Users, User } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    DbRepository.getUsers().then(setUsers);
  }, []);

  return (
    <div className="space-y-6 font-body">
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A]">
        <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
          USER REGISTRY // VOICEBOX SPEC
        </span>
        <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
          <Users className="text-[#EF4444]" /> TELEGRAM USERS DIRECTORY
        </h1>
        <p className="font-body text-sm text-[#A3A3A3] mt-1">
          Registered Telegram members using Remindly for commitment tracking.
        </p>
      </div>

      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-2 border-[#0A0A0A]">
            <thead className="bg-[#0A0A0A] text-[#FAFAFA] font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 border-r-2 border-[#333333]">User</th>
                <th className="p-3 border-r-2 border-[#333333]">Username</th>
                <th className="p-3 border-r-2 border-[#333333]">Telegram User ID</th>
                <th className="p-3 border-r-2 border-[#333333]">Timezone</th>
                <th className="p-3">First Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0A0A0A]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F5F5F5]">
                  <td className="p-3 font-bold text-[#0A0A0A] border-r-2 border-[#E5E5E5] flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-xs">
                      <User size={14} />
                    </div>
                    {u.display_name}
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-[#EF4444] border-r-2 border-[#E5E5E5]">
                    {u.telegram_username ? `@${u.telegram_username}` : 'N/A'}
                  </td>
                  <td className="p-3 font-mono text-xs text-[#0A0A0A] border-r-2 border-[#E5E5E5]">{u.telegram_user_id}</td>
                  <td className="p-3 font-mono text-xs text-[#525252] border-r-2 border-[#E5E5E5]">{u.timezone}</td>
                  <td className="p-3 font-mono text-xs text-[#525252]">{formatLocalDateTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
