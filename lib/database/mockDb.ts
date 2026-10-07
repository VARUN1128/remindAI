import { User, Chat, Reminder, ReminderInstance, ConversationContext, ReminderLog } from '@/types';

// In-memory data structures for Demo / Mock Mode
class MockDatabase {
  private users: User[] = [];
  private chats: Chat[] = [];
  private reminders: Reminder[] = [];
  private reminderInstances: ReminderInstance[] = [];
  private contexts: ConversationContext[] = [];
  private logs: ReminderLog[] = [];

  constructor() {
    // Start empty by default as requested: "no hardcoded data needed in /dashboard"
    this.users = [];
    this.chats = [];
    this.reminders = [];
    this.reminderInstances = [];
    this.contexts = [];
    this.logs = [];
  }

  public seedDefaults() {
    const now = new Date();
    const isoNow = now.toISOString();

    const tomorrow6PM = new Date(now);
    tomorrow6PM.setDate(tomorrow6PM.getDate() + 1);
    tomorrow6PM.setHours(18, 0, 0, 0);

    const friday4PM = new Date(now);
    friday4PM.setDate(friday4PM.getDate() + 2);
    friday4PM.setHours(16, 0, 0, 0);

    const friday2PM = new Date(friday4PM);
    friday2PM.setHours(14, 0, 0, 0);

    // Seed sample users
    this.users = [
      {
        id: 'usr-101',
        telegram_user_id: 123456789,
        telegram_username: 'alex_student',
        display_name: 'Alex Johnson',
        timezone: 'Asia/Kolkata',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'usr-102',
        telegram_user_id: 987654321,
        telegram_username: 'sarah_lead',
        display_name: 'Sarah Chen',
        timezone: 'Asia/Kolkata',
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    // Seed sample chats
    this.chats = [
      {
        id: 'chat-201',
        telegram_chat_id: 123456789,
        chat_type: 'private',
        chat_title: 'Alex Johnson (Private)',
        timezone: 'Asia/Kolkata',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: 'chat-202',
        telegram_chat_id: -1001987654321,
        chat_type: 'group',
        chat_title: '🚀 CS401 Senior Project Team',
        timezone: 'Asia/Kolkata',
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    // Seed sample reminders
    const rem1Id = 'rem-301';
    const rem2Id = 'rem-302';
    const rem3Id = 'rem-303';

    this.reminders = [
      {
        id: rem1Id,
        chat_id: 'chat-201',
        created_by_user_id: 'usr-101',
        title: 'Submit Operating Systems Assignment',
        description: 'Upload PDF to university portal',
        event_time: tomorrow6PM.toISOString(),
        reminder_time: tomorrow6PM.toISOString(),
        timezone: 'Asia/Kolkata',
        recurrence_type: 'none',
        status: 'scheduled',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: rem2Id,
        chat_id: 'chat-201',
        created_by_user_id: 'usr-101',
        title: 'Project Progress Sync Meeting',
        description: 'Meeting at 4:00 PM. Remind 2 hours before',
        event_time: friday4PM.toISOString(),
        reminder_time: friday2PM.toISOString(),
        timezone: 'Asia/Kolkata',
        recurrence_type: 'none',
        status: 'scheduled',
        created_at: isoNow,
        updated_at: isoNow,
      },
      {
        id: rem3Id,
        chat_id: 'chat-202',
        created_by_user_id: 'usr-102',
        title: 'Submit Weekly Team Status Report',
        description: 'Every Monday morning check-in',
        event_time: null,
        reminder_time: isoNow,
        timezone: 'Asia/Kolkata',
        recurrence_type: 'weekly',
        status: 'scheduled',
        created_at: isoNow,
        updated_at: isoNow,
      },
    ];

    // Seed instances
    this.reminderInstances = [
      {
        id: 'inst-401',
        reminder_id: rem1Id,
        scheduled_for: tomorrow6PM.toISOString(),
        status: 'scheduled',
        created_at: isoNow,
      },
      {
        id: 'inst-402',
        reminder_id: rem2Id,
        scheduled_for: friday2PM.toISOString(),
        status: 'scheduled',
        created_at: isoNow,
      },
      {
        id: 'inst-403',
        reminder_id: rem3Id,
        scheduled_for: isoNow,
        status: 'scheduled',
        created_at: isoNow,
      },
    ];

    // Seed sample delivery log
    this.logs = [
      {
        id: 'log-501',
        reminder_id: rem3Id,
        instance_id: 'inst-403',
        telegram_chat_id: -1001987654321,
        sent_at: isoNow,
        delivery_status: 'success',
        error_message: null,
        created_at: isoNow,
      },
    ];
  }

  // --- Users Operations ---
  public async upsertUser(data: { telegram_user_id: number; username?: string; display_name: string }): Promise<User> {
    let user = this.users.find((u) => u.telegram_user_id === data.telegram_user_id);
    const now = new Date().toISOString();

    if (user) {
      user.display_name = data.display_name || user.display_name;
      user.telegram_username = data.username || user.telegram_username;
      user.updated_at = now;
    } else {
      user = {
        id: `usr-${Date.now()}`,
        telegram_user_id: data.telegram_user_id,
        telegram_username: data.username || null,
        display_name: data.display_name || 'User',
        timezone: 'Asia/Kolkata',
        created_at: now,
        updated_at: now,
      };
      this.users.push(user);
    }
    return user;
  }

  public async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  // --- Chats Operations ---
  public async upsertChat(data: { telegram_chat_id: number; chat_type: 'private' | 'group' | 'supergroup'; title?: string }): Promise<Chat> {
    let chat = this.chats.find((c) => c.telegram_chat_id === data.telegram_chat_id);
    const now = new Date().toISOString();

    if (chat) {
      if (data.title) chat.chat_title = data.title;
      chat.updated_at = now;
    } else {
      chat = {
        id: `chat-${Date.now()}`,
        telegram_chat_id: data.telegram_chat_id,
        chat_type: data.chat_type,
        chat_title: data.title || (data.chat_type === 'private' ? 'Private Chat' : 'Group Chat'),
        timezone: 'Asia/Kolkata',
        created_at: now,
        updated_at: now,
      };
      this.chats.push(chat);
    }
    return chat;
  }

  public async getChats(): Promise<Chat[]> {
    return [...this.chats];
  }

  public async getChatByTelegramId(telegramChatId: number): Promise<Chat | null> {
    return this.chats.find((c) => c.telegram_chat_id === telegramChatId) || null;
  }

  // --- Reminders Operations ---
  public async createReminder(data: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>): Promise<Reminder> {
    const now = new Date().toISOString();
    const reminder: Reminder = {
      ...data,
      id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: now,
      updated_at: now,
    };
    this.reminders.push(reminder);

    // Create initial instance
    const instance: ReminderInstance = {
      id: `inst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reminder_id: reminder.id,
      scheduled_for: reminder.reminder_time,
      status: 'scheduled',
      created_at: now,
    };
    this.reminderInstances.push(instance);

    return reminder;
  }

  public async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return null;

    Object.assign(reminder, updates, { updated_at: new Date().toISOString() });

    // Update scheduled instances if reminder_time changed
    if (updates.reminder_time) {
      const activeInstances = this.reminderInstances.filter(
        (i) => i.reminder_id === id && i.status === 'scheduled'
      );
      for (const inst of activeInstances) {
        inst.scheduled_for = updates.reminder_time;
      }
    }

    return reminder;
  }

  public async cancelReminder(id: string): Promise<boolean> {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return false;

    reminder.status = 'cancelled';
    reminder.updated_at = new Date().toISOString();

    for (const inst of this.reminderInstances.filter((i) => i.reminder_id === id)) {
      inst.status = 'cancelled';
    }

    return true;
  }

  public async getReminders(): Promise<Reminder[]> {
    return this.reminders.map((r) => ({
      ...r,
      chat: this.chats.find((c) => c.id === r.chat_id),
      created_by: this.users.find((u) => u.id === r.created_by_user_id),
    }));
  }

  public async getRemindersByChat(chatId: string): Promise<Reminder[]> {
    const all = await this.getReminders();
    return all.filter((r) => r.chat_id === chatId && r.status === 'scheduled');
  }

  // --- Instances & Scheduler ---
  public async getDueInstances(): Promise<ReminderInstance[]> {
    const now = new Date();
    return this.reminderInstances.filter((inst) => {
      if (inst.status !== 'scheduled') return false;
      const scheduledDate = new Date(inst.scheduled_for);
      return scheduledDate <= now;
    });
  }

  public async claimInstance(instanceId: string): Promise<boolean> {
    const inst = this.reminderInstances.find((i) => i.id === instanceId);
    if (!inst || inst.status !== 'scheduled') return false;
    inst.status = 'claimed';
    return true;
  }

  public async markInstanceSent(instanceId: string, reminderId?: string): Promise<void> {
    const inst = this.reminderInstances.find((i) => i.id === instanceId);
    if (inst) {
      inst.status = 'sent';
      inst.sent_at = new Date().toISOString();
    }
    const remId = reminderId || inst?.reminder_id;
    if (remId) {
      const parentRem = this.reminders.find((r) => r.id === remId);
      if (parentRem) {
        parentRem.status = 'sent';
      }
    }
  }

  public async markInstanceFailed(instanceId: string, reminderId?: string, errorMsg?: string): Promise<void> {
    const inst = this.reminderInstances.find((i) => i.id === instanceId);
    if (inst) {
      inst.status = 'failed';
    }
    const remId = reminderId || inst?.reminder_id;
    if (remId) {
      const parentRem = this.reminders.find((r) => r.id === remId);
      if (parentRem) {
        parentRem.status = 'failed';
      }
    }
  }

  public async logDelivery(data: Omit<ReminderLog, 'id' | 'created_at'>): Promise<void> {
    const log: ReminderLog = {
      ...data,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.logs.push(log);
  }

  public async getLogs(): Promise<ReminderLog[]> {
    return [...this.logs].reverse();
  }

  // --- Conversation Context ---
  public async setContext(data: Omit<ConversationContext, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const now = new Date().toISOString();
    const existingIndex = this.contexts.findIndex(
      (c) => c.chat_id === data.chat_id && c.user_id === data.user_id
    );

    if (existingIndex >= 0) {
      this.contexts[existingIndex] = {
        ...this.contexts[existingIndex],
        ...data,
        updated_at: now,
      };
    } else {
      this.contexts.push({
        ...data,
        id: `ctx-${Date.now()}`,
        created_at: now,
        updated_at: now,
      });
    }
  }

  public async getContext(chatId: string, userId: string): Promise<ConversationContext | null> {
    const ctx = this.contexts.find((c) => c.chat_id === chatId && c.user_id === userId);
    if (!ctx) return null;

    if (new Date(ctx.expires_at) < new Date()) {
      this.clearContext(chatId, userId);
      return null;
    }
    return ctx;
  }

  public async clearContext(chatId: string, userId: string): Promise<void> {
    this.contexts = this.contexts.filter((c) => !(c.chat_id === chatId && c.user_id === userId));
  }

  // --- Analytics Aggregations ---
  public async getOwnerAnalytics(activeWindowDays = 30) {
    const totalUsers = this.users.length;
    const now = Date.now();
    const activeCutoff = now - activeWindowDays * 24 * 60 * 60 * 1000;

    const activeUserIds = new Set<string>();
    this.reminders.forEach((r) => {
      if (new Date(r.created_at).getTime() >= activeCutoff) {
        activeUserIds.add(r.created_by_user_id);
      }
    });
    this.users.forEach((u) => {
      if (new Date(u.created_at).getTime() >= activeCutoff) {
        activeUserIds.add(u.id);
      }
    });

    const totalChats = this.chats.length;
    const totalReminders = this.reminders.length;
    const scheduledReminders = this.reminders.filter((r) => r.status === 'scheduled').length;
    const sentReminders = this.reminders.filter((r) => r.status === 'sent').length;
    const failedReminders = this.reminders.filter((r) => r.status === 'failed').length;
    const cancelledReminders = this.reminders.filter((r) => r.status === 'cancelled').length;

    const groupChats = this.chats.filter((c) => c.chat_type === 'group' || c.chat_type === 'supergroup').length;
    const privateChats = this.chats.filter((c) => c.chat_type === 'private').length;

    const groupChatIds = new Set(
      this.chats.filter((c) => c.chat_type === 'group' || c.chat_type === 'supergroup').map((c) => c.id)
    );
    const groupReminders = this.reminders.filter((r) => groupChatIds.has(r.chat_id)).length;
    const privateReminders = totalReminders - groupReminders;

    const attempted = sentReminders + failedReminders;
    const deliverySuccessRate = attempted > 0 ? Math.round((sentReminders / attempted) * 100) : 100;

    return {
      totalUsers,
      activeUsers: activeUserIds.size,
      totalChats,
      totalReminders,
      scheduledReminders,
      sentReminders,
      failedReminders,
      cancelledReminders,
      groupChats,
      privateChats,
      privateReminders,
      groupReminders,
      deliverySuccessRate,
    };
  }

  public async getUserGrowth(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const map = new Map<string, number>();

    this.users.forEach((u) => {
      const dateKey = u.created_at ? u.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10);
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public async getReminderActivity(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const map = new Map<string, { created: number; sent: number; failed: number; cancelled: number }>();

    this.reminders.forEach((r) => {
      const dateKey = r.created_at ? r.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const curr = map.get(dateKey) || { created: 0, sent: 0, failed: 0, cancelled: 0 };
      curr.created++;
      if (r.status === 'sent') curr.sent++;
      if (r.status === 'failed') curr.failed++;
      if (r.status === 'cancelled') curr.cancelled++;
      map.set(dateKey, curr);
    });

    return Array.from(map.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public async getTopUsers(limit = 5) {
    return this.users
      .map((u) => {
        const userRems = this.reminders.filter((r) => r.created_by_user_id === u.id);
        const sent = userRems.filter((r) => r.status === 'sent').length;
        const sortedRems = [...userRems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastRem = sortedRems[0];
        return {
          user: u,
          totalReminders: userRems.length,
          sentReminders: sent,
          lastActive: lastRem ? lastRem.created_at : u.created_at,
        };
      })
      .sort((a, b) => b.totalReminders - a.totalReminders)
      .slice(0, limit);
  }

  public async getTopGroups(limit = 5) {
    const groups = this.chats.filter((c) => c.chat_type === 'group' || c.chat_type === 'supergroup');
    return groups
      .map((c) => {
        const groupRems = this.reminders.filter((r) => r.chat_id === c.id);
        const sent = groupRems.filter((r) => r.status === 'sent').length;
        const sortedRems = [...groupRems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastRem = sortedRems[0];
        return {
          chat: c,
          totalReminders: groupRems.length,
          sentReminders: sent,
          lastActive: lastRem ? lastRem.created_at : c.created_at,
        };
      })
      .sort((a, b) => b.totalReminders - a.totalReminders)
      .slice(0, limit);
  }

  public async getRecentActivity(limit = 10) {
    const events: Array<{
      id: string;
      type: 'REMINDER_CREATED' | 'REMINDER_SENT' | 'REMINDER_FAILED' | 'REMINDER_CANCELLED' | 'NEW_USER' | 'NEW_GROUP';
      user_name?: string | null;
      chat_title?: string | null;
      reminder_title?: string | null;
      timestamp: string;
      status?: string | null;
      details?: string | null;
    }> = [];

    this.reminders.forEach((r) => {
      const u = this.users.find((user) => user.id === r.created_by_user_id);
      const c = this.chats.find((chat) => chat.id === r.chat_id);
      events.push({
        id: `evt-rem-${r.id}`,
        type: 'REMINDER_CREATED',
        user_name: u?.display_name || 'User',
        chat_title: c?.chat_title || 'Chat',
        reminder_title: r.title,
        timestamp: r.created_at,
        status: r.status,
      });
    });

    this.logs.forEach((l) => {
      const r = this.reminders.find((rem) => rem.id === l.reminder_id);
      events.push({
        id: `evt-log-${l.id}`,
        type: l.delivery_status === 'success' ? 'REMINDER_SENT' : 'REMINDER_FAILED',
        user_name: 'System Scheduler',
        chat_title: `Chat #${l.telegram_chat_id}`,
        reminder_title: r?.title || 'Reminder',
        timestamp: l.sent_at,
        status: l.delivery_status,
        details: l.error_message || undefined,
      });
    });

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public async getAIIntentMetrics() {
    const counts: Record<string, number> = {
      CREATE_REMINDER: this.reminders.length,
      UPDATE_REMINDER: 0,
      CANCEL_REMINDER: this.reminders.filter((r) => r.status === 'cancelled').length,
      LIST_REMINDERS: 0,
      CLARIFY: this.contexts.length,
      OUT_OF_SCOPE: 0,
      GREETING: 0,
      ACKNOWLEDGEMENT: 0,
    };

    return Object.entries(counts).map(([intent, count]) => ({
      intent: intent as any,
      count,
    }));
  }

  public async getSystemReliability() {
    const sent = this.reminders.filter((r) => r.status === 'sent').length;
    const failed = this.reminders.filter((r) => r.status === 'failed').length;
    const pending = this.reminders.filter((r) => r.status === 'scheduled').length;
    const attempted = sent + failed;

    return {
      totalAttempted: attempted,
      totalSent: sent,
      totalFailed: failed,
      pendingScheduled: pending,
      successRate: attempted > 0 ? Math.round((sent / attempted) * 100) : 100,
      schedulerStatus: 'ACTIVE' as const,
      recentFailures: this.logs.filter((l) => l.delivery_status === 'failed').slice(0, 5),
    };
  }
}

// Global Singleton for in-memory mock store
export const mockDb = new MockDatabase();
