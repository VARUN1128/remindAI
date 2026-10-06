import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/database/supabaseClient';

export async function GET() {
  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
      !process.env.TELEGRAM_BOT_TOKEN.includes('placeholder')
  );

  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
      !process.env.GEMINI_API_KEY.includes('placeholder')
  );

  const demoMode = process.env.DEMO_MODE === 'true';

  return NextResponse.json({
    status: 'healthy',
    demoMode,
    databaseConnected: isSupabaseConfigured || demoMode,
    telegramConfigured,
    geminiConfigured,
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    timestamp: new Date().toISOString(),
  });
}
