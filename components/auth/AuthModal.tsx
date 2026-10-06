'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
        if (onSuccess) onSuccess();
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 shadow-2xl relative font-body">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#0A0A0A] text-[#FAFAFA] p-1.5 border-2 border-[#0A0A0A] hover:bg-[#EF4444] hover:border-[#EF4444] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 mb-6 border-b-4 border-[#0A0A0A]">
          <div className="bg-[#EF4444] p-2 border-2 border-[#0A0A0A]">
            <Image src="/logo.png" alt="Remindly Logo" width={28} height={28} className="h-7 w-auto object-contain brightness-0 invert" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold text-[#EF4444] tracking-widest uppercase block">
              USER ACCESS // VOICEBOX SPEC
            </span>
            <h2 className="font-display text-2xl uppercase tracking-tight text-[#0A0A0A]">
              {isSignUp ? 'CREATE ACCOUNT' : 'USER SIGN IN'}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border-2 border-[#EF4444] font-mono text-xs font-bold text-[#EF4444] uppercase">
            ⚠️ {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
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
            <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
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
            <label className="block font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
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
              className="vb-btn-primary w-full bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626] py-3 text-sm"
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
        <div className="mt-6 pt-4 border-t-2 border-[#E5E5E5] text-center font-mono text-xs">
          <span className="text-[#525252]">
            {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              router.push(`/login?mode=${isSignUp ? 'login' : 'signup'}`);
            }}
            className="font-bold text-[#0A0A0A] hover:text-[#EF4444] uppercase underline ml-1"
          >
            {isSignUp ? 'SIGN IN HERE' : 'CREATE ONE HERE'}
          </button>
        </div>

        <div className="mt-4 text-[11px] text-[#737373] flex items-center justify-center gap-1.5 font-mono">
          <ShieldCheck size={14} className="text-[#16A34A]" /> SUPABASE AUTH INTEGRATED
        </div>
      </div>
    </div>
  );
}
