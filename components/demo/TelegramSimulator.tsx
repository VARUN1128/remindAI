'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Bot, User, RefreshCw, CheckCircle, Users, Terminal } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  jsonOutput?: any;
}

export function TelegramSimulator() {
  const [chatType, setChatType] = useState<'private' | 'group'>('private');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: "👋 <b>REMINDLY AGENT ACTIVE</b>\n\nSpeak naturally to create or manage commitments:\n• <i>\"Remind me tomorrow at 6 PM to submit my assignment\"</i>\n• <i>\"Meeting Friday at 4 PM. Remind me 2 hours before\"</i>\n• <i>\"Remind me every Monday at 9 AM to submit the weekly report\"</i>",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [latestJson, setLatestJson] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const presets = [
    { label: 'Normal', text: 'Remind me tomorrow at 6 PM to submit my assignment' },
    { label: 'Relative', text: 'Meeting Friday at 4 PM. Remind me 2 hours before' },
    { label: 'Recurring', text: 'Remind me every Monday at 9 AM to submit weekly report' },
    { label: 'Messy / Clarify', text: 'Remind me about the meeting Friday evening' },
    { label: 'Group Chat', text: 'Guys, presentation Friday at 10 AM. Remind everyone Thursday evening', isGroup: true },
    { label: 'Out of Scope', text: 'Write me a Python scraper' },
  ];

  const handleSend = async (customText?: string, targetChatType?: 'private' | 'group') => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const currentType = targetChatType || chatType;
    if (targetChatType) setChatType(targetChatType);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          chatType: currentType,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          jsonOutput: data.extractedJSON,
        };
        setMessages((prev) => [...prev, botMsg]);
        setLatestJson(data.extractedJSON);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: `⚠️ ERROR: ${data.error || 'Failed to process request'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ ERROR: Network connection failure.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto border-4 border-[#0A0A0A] bg-[#FAFAFA] overflow-hidden flex flex-col shadow-2xl">
      {/* Header */}
      <div className="bg-[#0A0A0A] text-[#FAFAFA] p-4 flex items-center justify-between flex-wrap gap-4 border-b-4 border-[#0A0A0A] shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#EF4444] p-2 border-2 border-[#FAFAFA]">
            <Image src="/logo.png" alt="Remindly Logo" width={28} height={28} className="h-7 w-auto object-contain brightness-0 invert" />
          </div>
          <div>
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#EF4444] uppercase block">
              EDITORIAL SIMULATOR // VOICEBOX SPEC
            </span>
            <h3 className="font-display text-xl tracking-tight uppercase text-[#FAFAFA]">
              REMINDLY AGENT INTERACTION
            </h3>
          </div>
        </div>

        {/* Chat Type Switcher */}
        <div className="flex items-center bg-[#171717] p-1 border-2 border-[#333333]">
          <button
            onClick={() => setChatType('private')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
              chatType === 'private'
                ? 'bg-[#EF4444] text-[#FAFAFA]'
                : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
            }`}
          >
            Private Chat
          </button>
          <button
            onClick={() => setChatType('group')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              chatType === 'group'
                ? 'bg-[#EF4444] text-[#FAFAFA]'
                : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
            }`}
          >
            <Users size={14} /> Group Chat
          </button>
        </div>
      </div>

      {/* Preset Test Chips */}
      <div className="bg-[#F5F5F5] p-3 border-b-2 border-[#0A0A0A] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="font-mono text-[11px] font-bold text-[#0A0A0A] uppercase px-2 shrink-0">
          TRY PROMPTS:
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(preset.text, preset.isGroup ? 'group' : 'private')}
            className="vb-chip shrink-0 hover:bg-[#0A0A0A] hover:text-[#FAFAFA]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Simulator Container with Fixed Height & Scroll Bounds */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#0A0A0A] h-[460px] md:h-[500px] overflow-hidden shrink-0">
        {/* Chat Feed (2 Cols) */}
        <div className="md:col-span-2 p-4 overflow-y-auto flex flex-col space-y-4 bg-[#FAFAFA] h-full">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[88%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0 border-2 ${
                  msg.sender === 'user'
                    ? 'bg-[#0A0A0A] text-[#FAFAFA] border-[#0A0A0A]'
                    : 'bg-[#EF4444] text-[#FAFAFA] border-[#EF4444]'
                }`}
              >
                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div
                className={`p-4 border-2 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#0A0A0A] text-[#FAFAFA] border-[#0A0A0A]'
                    : 'bg-[#F5F5F5] text-[#0A0A0A] border-[#0A0A0A]'
                }`}
              >
                <div
                  className="whitespace-pre-wrap leading-relaxed font-body"
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
                <span
                  className={`font-mono text-[10px] block mt-2 ${
                    msg.sender === 'user' ? 'text-[#D4D4D4] text-right' : 'text-[#525252]'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 font-mono text-xs text-[#EF4444] p-2 font-bold uppercase">
              <RefreshCw size={14} className="animate-spin" /> Remindly AI parsing intent & schedule...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Structured JSON Output Drawer (1 Col) */}
        <div className="p-4 bg-[#F5F5F5] overflow-y-auto flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3 border-b-2 border-[#0A0A0A] pb-2 shrink-0">
              <h4 className="font-mono text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={14} className="text-[#EF4444]" /> EXTRACTED AI JSON
              </h4>
              {latestJson && (
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#0A0A0A] text-[#FAFAFA] font-bold uppercase">
                  {latestJson.intent}
                </span>
              )}
            </div>

            {latestJson ? (
              <pre className="text-[11px] font-mono bg-[#0A0A0A] text-[#FAFAFA] p-3 border-2 border-[#0A0A0A] overflow-x-auto overflow-y-auto max-h-[340px] leading-normal">
                {JSON.stringify(latestJson, null, 2)}
              </pre>
            ) : (
              <div className="font-mono text-xs text-[#525252] p-4 text-center border-2 border-dashed border-[#D4D4D4]">
                Send a message to view the real-time structured JSON extraction payload.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#0A0A0A] text-[11px] text-[#525252] space-y-1 shrink-0">
            <div className="font-mono font-bold text-[#0A0A0A] flex items-center gap-1.5 uppercase">
              <CheckCircle size={13} className="text-[#16A34A]" /> VOICEBOX VALIDATION ACTIVE
            </div>
            <p className="font-body text-xs">Strict Zod schema checks enforce zero scheduling hallucinations.</p>
          </div>
        </div>
      </div>

      {/* Input Bar - Always Fixed at Bottom */}
      <div className="p-3 bg-[#0A0A0A] border-t-4 border-[#0A0A0A] flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Type natural message in ${chatType === 'group' ? 'Group Chat' : 'Private Chat'} mode...`}
          className="flex-1 bg-[#FAFAFA] border-2 border-[#FAFAFA] px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-[#737373] font-body focus:outline-none focus:border-[#EF4444]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="vb-btn-primary bg-[#EF4444] border-[#EF4444] hover:bg-[#DC2626] hover:border-[#DC2626] disabled:opacity-50"
        >
          Send <Send size={15} />
        </button>
      </div>
    </div>
  );
}
