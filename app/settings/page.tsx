'use client';

import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertCircle, Copy, Check, Key, Bot, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => {});

    setDomain(window.location.origin);
  }, []);

  const webhookUrl = `${domain}/api/telegram/webhook`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-body">
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-6 border-4 border-[#0A0A0A]">
        <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-widest block mb-1">
          SYSTEM CONFIGURATION // VOICEBOX SPEC
        </span>
        <h1 className="font-display text-3xl uppercase text-[#FAFAFA] tracking-tight flex items-center gap-2">
          <Settings className="text-[#EF4444]" /> SETTINGS & CREDENTIALS SETUP
        </h1>
        <p className="font-body text-sm text-[#A3A3A3] mt-1">
          Configure API credentials, webhook URLs, and system timezones for production deployment.
        </p>
      </div>

      {/* System Execution Status Banner */}
      <div className="vb-card-elevated flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles size={14} /> EXECUTION MODE STATUS
          </span>
          <h2 className="font-display text-2xl uppercase text-[#0A0A0A]">
            {health?.demoMode ? 'RUNNING IN DEMO_MODE (MOCK)' : 'RUNNING IN LIVE PRODUCTION MODE'}
          </h2>
          <p className="font-body text-sm text-[#525252] mt-1">
            {health?.demoMode
              ? 'Telegram calls, Gemini AI parsing, and database schemas are operating with VoiceBox mock engines.'
              : 'Connected to live external APIs.'}
          </p>
        </div>

        <span
          className={`font-mono text-xs font-bold px-4 py-1.5 border-2 uppercase tracking-wider ${
            health?.demoMode
              ? 'bg-[#FEFCE8] text-[#CA8A04] border-[#CA8A04]'
              : 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]'
          }`}
        >
          {health?.demoMode ? 'MOCK / DEMO' : 'LIVE API'}
        </span>
      </div>

      {/* Telegram Webhook Box */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
        <h3 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
          <Bot className="text-[#EF4444]" /> TELEGRAM WEBHOOK ENDPOINT
        </h3>
        <p className="font-body text-sm text-[#525252]">
          Configure your Telegram Bot Webhook to target this exact endpoint once deployed or tunneling (e.g. ngrok):
        </p>

        <div className="flex items-center gap-2 bg-[#0A0A0A] text-[#FAFAFA] p-3 border-2 border-[#0A0A0A] font-mono text-xs">
          <span className="flex-1 truncate">{webhookUrl}</span>
          <button onClick={copyWebhook} className="vb-btn-primary py-1.5 px-3 text-xs bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626]">
            {copied ? <Check size={14} className="text-[#FAFAFA]" /> : <Copy size={14} />}
            {copied ? 'COPIED' : 'COPY URL'}
          </button>
        </div>
      </div>

      {/* Environment Checklist */}
      <div className="bg-[#FAFAFA] border-4 border-[#0A0A0A] p-6 space-y-4">
        <h3 className="font-display text-xl uppercase text-[#0A0A0A] flex items-center gap-2">
          <Key className="text-[#EF4444]" /> ENVIRONMENT VARIABLES CHECKLIST
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A0A0A]">TELEGRAM_BOT_TOKEN</span>
              {health?.telegramConfigured ? (
                <span className="text-[#16A34A] font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> CONFIGURED
                </span>
              ) : (
                <span className="text-[#CA8A04] font-bold flex items-center gap-1">
                  <AlertCircle size={14} /> MOCK (DEMO)
                </span>
              )}
            </div>
            <p className="font-body text-xs text-[#525252]">Required for Telegram bot messages</p>
          </div>

          <div className="p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A0A0A]">GEMINI_API_KEY</span>
              {health?.geminiConfigured ? (
                <span className="text-[#16A34A] font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> CONFIGURED
                </span>
              ) : (
                <span className="text-[#CA8A04] font-bold flex items-center gap-1">
                  <AlertCircle size={14} /> MOCK (DEMO)
                </span>
              )}
            </div>
            <p className="font-body text-xs text-[#525252]">Required for Gemini AI parsing</p>
          </div>

          <div className="p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A0A0A]">NEXT_PUBLIC_SUPABASE_URL</span>
              {health?.databaseConnected && !health?.demoMode ? (
                <span className="text-[#16A34A] font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> CONFIGURED
                </span>
              ) : (
                <span className="text-[#CA8A04] font-bold flex items-center gap-1">
                  <AlertCircle size={14} /> MOCK DB FALLBACK
                </span>
              )}
            </div>
            <p className="font-body text-xs text-[#525252]">PostgreSQL database URL</p>
          </div>

          <div className="p-4 border-2 border-[#0A0A0A] bg-[#F5F5F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0A0A0A]">DEFAULT_TIMEZONE</span>
              <span className="text-[#EF4444] font-bold">
                {health?.defaultTimezone || 'Asia/Kolkata'}
              </span>
            </div>
            <p className="font-body text-xs text-[#525252]">System reference timezone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
