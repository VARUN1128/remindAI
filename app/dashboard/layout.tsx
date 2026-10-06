'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  ExternalLink,
  Bot,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setDemoMode(data.demoMode);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: 'OVERVIEW', href: '/dashboard', icon: LayoutDashboard },
    { label: 'REMINDERS', href: '/dashboard/reminders', icon: Calendar },
    { label: 'USERS', href: '/dashboard/users', icon: Users },
    { label: 'CHATS / GROUPS', href: '/dashboard/chats', icon: MessageSquare },
    { label: 'ACTIVITY', href: '/dashboard/activity', icon: Bot },
    { label: 'SETTINGS', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col md:flex-row font-body">
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* VoiceBox Stark Sidebar */}
      <aside className="w-full md:w-72 border-r-4 border-[#0A0A0A] bg-[#0A0A0A] text-[#FAFAFA] p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b-2 border-[#333333]">
            <div className="bg-[#EF4444] p-2 border-2 border-[#FAFAFA]">
              <Image src="/logo.png" alt="Remindly Logo" width={28} height={28} className="h-7 w-auto object-contain brightness-0 invert" />
            </div>
            <div>
              <span className="font-display text-xl tracking-tight uppercase text-[#FAFAFA] block leading-none">
                REMINDLY
              </span>
              <span className="font-mono text-[10px] font-bold text-[#EF4444] tracking-widest uppercase block mt-1">
                ADMIN CONTROL // VOICEBOX
              </span>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 border-2 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#EF4444] text-[#FAFAFA] border-[#EF4444]'
                      : 'bg-[#171717] text-[#A3A3A3] border-[#333333] hover:border-[#FAFAFA] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account / Demo Notice */}
        <div className="mt-8 space-y-3">
          {user ? (
            <div className="p-4 bg-[#171717] border-2 border-[#FAFAFA] space-y-2">
              <span className="font-mono text-[10px] font-bold text-[#EF4444] uppercase tracking-wider block">
                AUTHENTICATED USER
              </span>
              <div className="font-mono text-xs font-bold text-[#FAFAFA] truncate">
                {user.display_name}
              </div>
              <button
                onClick={() => logout()}
                className="vb-btn-secondary w-full py-1.5 px-3 text-xs border-[#FAFAFA] text-[#FAFAFA] hover:bg-[#EF4444] hover:border-[#EF4444]"
              >
                <LogOut size={12} /> LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="vb-btn-primary w-full bg-[#EF4444] border-[#EF4444] text-xs py-2.5"
            >
              SIGN IN / REGISTER
            </button>
          )}

          <div className="p-3 bg-[#171717] border-2 border-[#333333] space-y-1">
            <div className="font-mono text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={12} /> STATUS // {demoMode ? 'DEMO MODE' : 'LIVE API'}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#EF4444] hover:underline uppercase"
            >
              VIEW LANDING PAGE <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b-4 border-[#0A0A0A] bg-[#FAFAFA] px-6 flex items-center justify-between">
          <div className="font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
            <span className="text-[#EF4444]">REMINDLY</span> /{' '}
            <span className="text-[#0A0A0A]">{pathname.replace('/dashboard', '') || 'OVERVIEW'}</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#0A0A0A]">
                <div className="w-7 h-7 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-xs">
                  <UserIcon size={14} />
                </div>
                <span>{user.display_name}</span>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="font-mono text-xs font-bold px-3 py-1.5 bg-[#0A0A0A] text-[#FAFAFA] hover:bg-[#EF4444] uppercase tracking-wider"
              >
                SIGN IN
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto bg-[#FAFAFA]">{children}</main>
      </div>
    </div>
  );
}
