'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TelegramSimulator } from '@/components/demo/TelegramSimulator';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowRight, MessageSquare, ShieldCheck, Users, LogOut, User as UserIcon } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login?mode=signup');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between font-body">
      {/* VoiceBox Magazine Header */}
      <header className="border-b-4 border-[#0A0A0A] bg-[#FAFAFA] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0A0A0A] p-2 border-2 border-[#0A0A0A]">
              <Image src="/logo.png" alt="Remindly Logo" width={32} height={32} className="h-8 w-auto object-contain brightness-0 invert" />
            </div>
            <div>
              <span className="font-display text-2xl tracking-tight uppercase text-[#0A0A0A] block leading-none">
                REMINDLY
              </span>
              <span className="font-mono text-[10px] font-bold text-[#EF4444] tracking-widest uppercase block mt-0.5">
                AI COMMITMENT AGENT
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            <Link href="#features" className="hover:text-[#EF4444] transition-colors">
              EDITORIAL PROMISES
            </Link>
            <Link href="#demo" className="hover:text-[#EF4444] transition-colors">
              LIVE SIMULATOR
            </Link>
            <Link href="/dashboard" className="hover:text-[#EF4444] transition-colors">
              ADMIN DASHBOARD
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#0A0A0A] flex items-center gap-1.5">
                  <UserIcon size={14} /> {user.display_name}
                </span>
                <button
                  onClick={() => logout()}
                  className="vb-btn-secondary py-2 px-3 text-xs"
                >
                  <LogOut size={14} /> LOGOUT
                </button>
              </div>
            ) : (
              <Link href="/login?mode=signup" className="vb-btn-primary">
                GET STARTED NOW <ArrowRight size={14} />
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-14 px-6 border-b-4 border-[#0A0A0A] bg-[#FAFAFA]">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Overline Category Label */}
            <div className="inline-block bg-[#0A0A0A] text-[#FAFAFA] font-mono text-[11px] font-bold px-3 py-1 uppercase tracking-widest border-2 border-[#0A0A0A]">
              ISSUE 01 // CONVERSATION INTO COMMITMENTS
            </div>

            {/* Display Headline - VoiceBox Archivo Black 56px */}
            <h1 className="font-display text-5xl md:text-7xl uppercase text-[#0A0A0A] leading-[1.02] tracking-tight">
              NEVER FORGET WHAT YOU <span className="bg-[#EF4444] text-[#FAFAFA] px-3 py-1 inline-block">SAID YOU'D DO.</span>
            </h1>

            {/* Body Large Paragraph */}
            <p className="text-xl md:text-2xl text-[#0A0A0A] max-w-3xl font-body leading-relaxed border-l-4 border-[#EF4444] pl-5 py-1">
              Remindly turns everyday natural language conversations into reliable commitments and group reminders. Zero command learning required.
            </p>

            {/* Example Prompt Chips Grid */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="vb-card p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5]">
                <span className="font-mono text-[10px] text-[#EF4444] font-bold uppercase block mb-1">PROMPT // 01</span>
                <p className="font-body text-sm font-semibold text-[#0A0A0A]">
                  "Remind me tomorrow at 6 PM to submit my assignment."
                </p>
              </div>
              <div className="vb-card p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5]">
                <span className="font-mono text-[10px] text-[#EF4444] font-bold uppercase block mb-1">PROMPT // 02</span>
                <p className="font-body text-sm font-semibold text-[#0A0A0A]">
                  "Meeting Friday at 4 PM. Remind me 2 hours before."
                </p>
              </div>
              <div className="vb-card p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5]">
                <span className="font-mono text-[10px] text-[#EF4444] font-bold uppercase block mb-1">PROMPT // 03</span>
                <p className="font-body text-sm font-semibold text-[#0A0A0A]">
                  "Guys, presentation Friday at 10. Remind everyone Thursday evening."
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 flex flex-wrap items-center gap-4">
              <button onClick={handleGetStarted} className="vb-btn-primary text-base py-3 px-8">
                {user ? 'ENTER DASHBOARD' : 'GET STARTED NOW'} <ArrowRight size={18} />
              </button>
              <a href="#demo" className="vb-btn-secondary text-base py-3 px-8">
                TEST SIMULATOR
              </a>
            </div>
          </div>
        </section>

        {/* Live Interactive Simulator Section */}
        <section id="demo" className="py-16 px-6 max-w-7xl mx-auto">
          <div className="mb-10 text-left border-b-4 border-[#0A0A0A] pb-4">
            <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block">
              INTERACTIVE BENCHMARK // VOICEBOX SYSTEM
            </span>
            <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0A0A0A] mt-1">
              EXPERIENCE THE AGENT LIVE
            </h2>
            <p className="font-body text-base text-[#525252] mt-1">
              Test natural-language commitments, relative timings, and group chat permissions.
            </p>
          </div>
          <TelegramSimulator />
        </section>

        {/* Product Principles (Editorial Cards) */}
        <section id="features" className="py-16 px-6 bg-[#F5F5F5] border-t-4 border-b-4 border-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 border-b-4 border-[#0A0A0A] pb-4">
              <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block">
                CORE PHILOSOPHY // VOICEBOX SPEC
              </span>
              <h2 className="font-display text-3xl md:text-4xl uppercase text-[#0A0A0A] mt-1">
                EDITORIAL PRINCIPLES
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="vb-card-elevated space-y-4">
                <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-sm">
                  <MessageSquare size={20} />
                </div>
                <h3 className="font-display text-xl uppercase text-[#0A0A0A]">1. SPEAK NATURALLY</h3>
                <p className="font-body text-sm text-[#525252] leading-relaxed">
                  No rigid slash commands. Supports absolute dates, relative durations ("in 3 hours"), recurring commitments ("every Monday"), and event-relative offsets.
                </p>
              </div>

              <div className="vb-card-elevated space-y-4">
                <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-sm">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="font-display text-xl uppercase text-[#0A0A0A]">2. ZERO HALLUCINATIONS</h3>
                <p className="font-body text-sm text-[#525252] leading-relaxed">
                  The AI agent NEVER guesses ambiguous schedules. If time or date details are missing, it halts and asks a direct clarification question.
                </p>
              </div>

              <div className="vb-card-elevated space-y-4">
                <div className="w-10 h-10 bg-[#0A0A0A] text-[#FAFAFA] flex items-center justify-center font-bold text-sm">
                  <Users size={20} />
                </div>
                <h3 className="font-display text-xl uppercase text-[#0A0A0A]">3. GROUP COORDINATION</h3>
                <p className="font-body text-sm text-[#525252] leading-relaxed">
                  Add Remindly to Telegram study groups or work teams. Mention group deadlines and everyone receives notifications right in the channel.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-[#FAFAFA] py-10 px-6 border-t-4 border-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Remindly Logo" width={28} height={28} className="h-7 w-auto object-contain brightness-0 invert" />
            <span className="font-display text-lg uppercase tracking-tight">REMINDLY EDITORIAL</span>
          </div>

          <p className="font-mono text-xs text-[#A3A3A3]">
            © 2026 REMINDLY. VOICEBOX EDITORIAL SYSTEM // BUILT WITH NEXT.JS, SUPABASE & GEMINI.
          </p>

          <div className="flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
            <Link href="/dashboard" className="hover:text-[#EF4444]">
              DASHBOARD
            </Link>
            <Link href="/settings" className="hover:text-[#EF4444]">
              SETTINGS
            </Link>
            <Link href="/api/health" className="hover:text-[#EF4444]">
              HEALTH API
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
