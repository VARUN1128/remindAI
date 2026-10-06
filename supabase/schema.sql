-- ====================================================================
-- REMINDLY - Supabase Database Schema
-- "An AI agent that turns conversations into commitments and reminders."
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores registered Telegram users who interact with Remindly
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by Telegram User ID
CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id ON public.users(telegram_user_id);

-- --------------------------------------------------------------------
-- 2. CHATS TABLE
-- Stores Telegram private chats and group/supergroup chats
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  chat_type TEXT NOT NULL CHECK (chat_type IN ('private', 'group', 'supergroup')),
  chat_title TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by Telegram Chat ID
CREATE INDEX IF NOT EXISTS idx_chats_telegram_chat_id ON public.chats(telegram_chat_id);

-- --------------------------------------------------------------------
-- 3. REMINDERS TABLE
-- Master table for all created commitments and scheduled reminders
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_time TIMESTAMPTZ,
  reminder_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  recurrence_type TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'custom')),
  recurrence_rule JSONB,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying active reminders
CREATE INDEX IF NOT EXISTS idx_reminders_chat_id ON public.reminders(chat_id);
CREATE INDEX IF NOT EXISTS idx_reminders_created_by ON public.reminders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status_time ON public.reminders(status, reminder_time);

-- --------------------------------------------------------------------
-- 4. REMINDER INSTANCES TABLE
-- Handles individual executions for single, multiple, and recurring reminders
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'claimed', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast cron execution queries
CREATE INDEX IF NOT EXISTS idx_reminder_instances_due ON public.reminder_instances(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_instances_reminder_id ON public.reminder_instances(reminder_id);

-- --------------------------------------------------------------------
-- 5. CONVERSATION CONTEXT TABLE
-- Temporary state storage for multi-turn clarification conversations
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- e.g., 'AWAITING_TIME', 'AWAITING_CONFIRMATION', 'SELECT_UPDATE_TARGET'
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_chat_user_context UNIQUE (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_context_expiry ON public.conversation_context(expires_at);

-- --------------------------------------------------------------------
-- 6. REMINDER LOGS TABLE
-- Audit log for reminder delivery tracking and error monitoring
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  instance_id UUID REFERENCES public.reminder_instances(id) ON DELETE SET NULL,
  telegram_chat_id BIGINT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_reminder_id ON public.reminder_logs(reminder_id);

-- --------------------------------------------------------------------
-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_context_updated_at BEFORE UPDATE ON public.conversation_context FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Service Role has full access; client access is restricted.
-- --------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Allow read-only access for anon dashboard demo, full access for service_role
CREATE POLICY "Allow public read access for dashboard" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access for dashboard" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Allow public read access for dashboard" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Allow public read access for dashboard" ON public.reminder_instances FOR SELECT USING (true);
CREATE POLICY "Allow public read access for dashboard" ON public.conversation_context FOR SELECT USING (true);
CREATE POLICY "Allow public read access for dashboard" ON public.reminder_logs FOR SELECT USING (true);
