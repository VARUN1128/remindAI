import { isSupabaseConfigured, supabase } from './supabaseClient';
import { mockDb } from './mockDb';
import { User, Chat, Reminder, ReminderInstance, ConversationContext, ReminderLog } from '@/types';

const isDemoMode = process.env.DEMO_MODE === 'true' || !isSupabaseConfigured;

export class DbRepository {
  // --- USERS ---
  static async upsertUser(data: { telegram_user_id: number; username?: string; display_name: string }): Promise<User> {
    if (isDemoMode || !supabase) {
      return mockDb.upsertUser(data);
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_user_id', data.telegram_user_id)
      .single();

    if (existingUser) {
      const { data: updated, error } = await supabase
        .from('users')
        .update({
          display_name: data.display_name || existingUser.display_name,
          telegram_username: data.username || existingUser.telegram_username,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        telegram_user_id: data.telegram_user_id,
        telegram_username: data.username || null,
        display_name: data.display_name || 'User',
      })
      .select()
      .single();

    if (error) throw error;
    return newUser;
  }

  static async getUsers(): Promise<User[]> {
    if (isDemoMode || !supabase) {
      return mockDb.getUsers();
    }
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // --- CHATS ---
  static async upsertChat(data: { telegram_chat_id: number; chat_type: 'private' | 'group' | 'supergroup'; title?: string }): Promise<Chat> {
    if (isDemoMode || !supabase) {
      return mockDb.upsertChat(data);
    }

    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('telegram_chat_id', data.telegram_chat_id)
      .single();

    if (existingChat) {
      if (data.title) {
        await supabase.from('chats').update({ chat_title: data.title }).eq('id', existingChat.id);
      }
      return existingChat;
    }

    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        telegram_chat_id: data.telegram_chat_id,
        chat_type: data.chat_type,
        chat_title: data.title || (data.chat_type === 'private' ? 'Private Chat' : 'Group Chat'),
      })
      .select()
      .single();

    if (error) throw error;
    return newChat;
  }

  static async getChats(): Promise<Chat[]> {
    if (isDemoMode || !supabase) {
      return mockDb.getChats();
    }
    const { data, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getChatByTelegramId(telegramChatId: number): Promise<Chat | null> {
    if (isDemoMode || !supabase) {
      return mockDb.getChatByTelegramId(telegramChatId);
    }
    const { data, error } = await supabase.from('chats').select('*').eq('telegram_chat_id', telegramChatId).single();
    if (error || !data) return null;
    return data;
  }

  // --- REMINDERS ---
  static async createReminder(data: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    if (isDemoMode || !supabase) {
      return mockDb.createReminder(data);
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        chat_id: data.chat_id,
        created_by_user_id: data.created_by_user_id,
        title: data.title,
        description: data.description || null,
        event_time: data.event_time || null,
        reminder_time: data.reminder_time,
        timezone: data.timezone,
        recurrence_type: data.recurrence_type || 'none',
        recurrence_rule: data.recurrence_rule || null,
        status: data.status || 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Insert instance
    await supabase.from('reminder_instances').insert({
      reminder_id: reminder.id,
      scheduled_for: reminder.reminder_time,
      status: 'scheduled',
    });

    return reminder;
  }

  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    if (isDemoMode || !supabase) {
      return mockDb.updateReminder(id, updates);
    }

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (updates.reminder_time) {
      await supabase
        .from('reminder_instances')
        .update({ scheduled_for: updates.reminder_time })
        .eq('reminder_id', id)
        .eq('status', 'scheduled');
    }

    return data;
  }

  static async cancelReminder(id: string): Promise<boolean> {
    if (isDemoMode || !supabase) {
      return mockDb.cancelReminder(id);
    }

    const { error: remError } = await supabase
      .from('reminders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (remError) return false;

    await supabase
      .from('reminder_instances')
      .update({ status: 'cancelled' })
      .eq('reminder_id', id);

    return true;
  }

  static async getReminders(): Promise<Reminder[]> {
    if (isDemoMode || !supabase) {
      return mockDb.getReminders();
    }
    const { data, error } = await supabase
      .from('reminders')
      .select('*, chat:chats(*), created_by:users(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRemindersByChat(chatId: string): Promise<Reminder[]> {
    if (isDemoMode || !supabase) {
      return mockDb.getRemindersByChat(chatId);
    }
    const { data, error } = await supabase
      .from('reminders')
      .select('*, chat:chats(*), created_by:users(*)')
      .eq('chat_id', chatId)
      .eq('status', 'scheduled')
      .order('reminder_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getRemindersByUser(userId: string): Promise<Reminder[]> {
    if (isDemoMode || !supabase) {
      const all = await mockDb.getReminders();
      return all.filter((r) => r.created_by_user_id === userId);
    }
    const { data, error } = await supabase
      .from('reminders')
      .select('*, chat:chats(*), created_by:users(*)')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // --- SCHEDULER & INSTANCES ---
  static async getDueInstances(): Promise<(ReminderInstance & { reminder: Reminder & { chat: Chat } })[]> {
    if (isDemoMode || !supabase) {
      const instances = await mockDb.getDueInstances();
      const reminders = await mockDb.getReminders();
      const chats = await mockDb.getChats();

      return instances.map((inst) => {
        const rem = reminders.find((r) => r.id === inst.reminder_id)!;
        const chat = chats.find((c) => c.id === rem.chat_id)!;
        return {
          ...inst,
          reminder: {
            ...rem,
            chat,
          },
        };
      }) as any;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('reminder_instances')
      .select('*, reminder:reminders(*, chat:chats(*))')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (error) throw error;
    return (data || []) as any;
  }

  static async claimInstance(instanceId: string): Promise<boolean> {
    if (isDemoMode || !supabase) {
      return mockDb.claimInstance(instanceId);
    }

    const { data, error } = await supabase
      .from('reminder_instances')
      .update({ status: 'claimed' })
      .eq('id', instanceId)
      .eq('status', 'scheduled')
      .select();

    return Boolean(!error && data && data.length > 0);
  }

  static async markInstanceSent(instanceId: string): Promise<void> {
    if (isDemoMode || !supabase) {
      return mockDb.markInstanceSent(instanceId);
    }

    const now = new Date().toISOString();
    await supabase
      .from('reminder_instances')
      .update({ status: 'sent', sent_at: now })
      .eq('id', instanceId);
  }

  static async logDelivery(data: Omit<ReminderLog, 'id' | 'created_at'>): Promise<void> {
    if (isDemoMode || !supabase) {
      return mockDb.logDelivery(data);
    }

    await supabase.from('reminder_logs').insert(data);
  }

  static async getLogs(): Promise<ReminderLog[]> {
    if (isDemoMode || !supabase) {
      return mockDb.getLogs();
    }

    const { data, error } = await supabase
      .from('reminder_logs')
      .select('*, reminder:reminders(*)')
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  // --- CONVERSATION CONTEXT ---
  static async setContext(data: Omit<ConversationContext, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    if (isDemoMode || !supabase) {
      return mockDb.setContext(data);
    }

    await supabase.from('conversation_context').upsert(
      {
        chat_id: data.chat_id,
        user_id: data.user_id,
        context_type: data.context_type,
        context_data: data.context_data,
        expires_at: data.expires_at,
      },
      { onConflict: 'chat_id,user_id' }
    );
  }

  static async getContext(chatId: string, userId: string): Promise<ConversationContext | null> {
    if (isDemoMode || !supabase) {
      return mockDb.getContext(chatId, userId);
    }

    const { data, error } = await supabase
      .from('conversation_context')
      .select('*')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    if (new Date(data.expires_at) < new Date()) {
      await this.clearContext(chatId, userId);
      return null;
    }
    return data;
  }

  static async clearContext(chatId: string, userId: string): Promise<void> {
    if (isDemoMode || !supabase) {
      return mockDb.clearContext(chatId, userId);
    }

    await supabase
      .from('conversation_context')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);
  }
}
