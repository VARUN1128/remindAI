'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, signup } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let res;
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Please provide your full name');
          setSubmitting(false);
          return;
        }
        res = await signup(displayName, email, password);
      } else {
        res = await login(email, password);
      }

      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#FAFAFA] border-4 border-[#0A0A0A] p-8 shadow-2xl relative">
      {/* Top Label */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b-4 border-[#0A0A0A]">
        <div className="bg-[#EF4444] p-2 border-2 border-[#0A0A0A]">
          <Image src="/logo.png" alt="Remindly Logo" width={28} height={28} className="h-7 w-auto object-contain brightness-0 invert" />
        </div>
        <div>
          <span className="font-mono text-[10px] font-bold text-[#EF4444] tracking-widest uppercase block">
            AUTHENTICATION PORTAL // VOICEBOX
          </span>
          <h1 className="font-display text-2xl uppercase tracking-tight text-[#0A0A0A]">
            {isSignUp ? 'CREATE ACCOUNT' : 'USER SIGN IN'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-[#FEF2F2] border-2 border-[#EF4444] font-mono text-xs font-bold text-[#EF4444] uppercase">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignUp && (
          <div>
            <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              FULL NAME / USERNAME
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A] z-10" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="vb-input font-body text-sm"
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A] z-10" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="vb-input font-body text-sm"
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5">
            PASSWORD
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A] z-10" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="vb-input font-body text-sm"
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="vb-btn-primary w-full bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626] py-3.5 text-sm"
          >
            {submitting
              ? 'AUTHENTICATING...'
              : isSignUp
              ? 'CREATE ACCOUNT & MAP REMINDERS'
              : 'SIGN IN TO DASHBOARD'}{' '}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Toggle Sign Up / Sign In */}
      <div className="mt-8 pt-4 border-t-2 border-[#E5E5E5] text-center font-mono text-xs">
        <span className="text-[#525252]">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            router.replace(`/login?mode=${isSignUp ? 'login' : 'signup'}`);
          }}
          className="font-bold text-[#0A0A0A] hover:text-[#EF4444] uppercase underline ml-1"
        >
          {isSignUp ? 'SIGN IN HERE' : 'CREATE ONE HERE'}
        </button>
      </div>

      <div className="mt-4 text-[11px] text-[#737373] flex items-center justify-center gap-1.5 font-mono">
        <ShieldCheck size={14} className="text-[#16A34A]" /> SUPABASE AUTHENTICATION READY
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col justify-between font-body">
      {/* Header */}
      <header className="border-b-4 border-[#0A0A0A] bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>

          <Link href="/" className="vb-btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
            <ArrowLeft size={14} /> BACK TO HOME
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<div className="font-mono text-xs font-bold text-[#0A0A0A]">LOADING AUTHENTICATION PORTAL...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] text-[#FAFAFA] py-6 px-6 border-t-4 border-[#0A0A0A] text-center font-mono text-xs">
        © 2026 REMINDLY. VOICEBOX SYSTEM // SUPABASE AUTH INTEGRATED.
      </footer>
    </div>
  );
}
