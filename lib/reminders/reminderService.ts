import { DbRepository } from '@/lib/database/repository';
import { Reminder, AIExtractedPayload, Chat, User } from '@/types';
import { telegramProvider } from '@/lib/telegram/telegramProvider';
import { formatLocalDateTime, isTimeInPast, getRelativeTimeString } from '@/lib/utils/dateUtils';
import { ContextManager } from '@/lib/ai/contextManager';

export class ReminderService {
  /**
   * CREATE REMINDER
   */
  static async handleCreateReminder(
    dbChat: Chat,
    dbUser: User,
    aiPayload: AIExtractedPayload
  ): Promise<string> {
    const { title, reminder_time, event_time, recurrence, timezone = dbChat.timezone || 'Asia/Kolkata' } = aiPayload;

    if (!title || !reminder_time) {
      return "I couldn't create the reminder because the title or time was missing. Could you specify what and when?";
    }

    // Check if time is in the past
    if (isTimeInPast(reminder_time)) {
      return `⚠️ The time you requested (${formatLocalDateTime(
        reminder_time,
        timezone
      )}) is in the past! Please provide a future time for the reminder.`;
    }

    const reminder = await DbRepository.createReminder({
      chat_id: dbChat.id,
      created_by_user_id: dbUser.id,
      title,
      description: event_time ? `Event at ${formatLocalDateTime(event_time, timezone)}` : null,
      event_time: event_time || null,
      reminder_time,
      timezone,
      recurrence_type: recurrence || 'none',
      status: 'scheduled',
    });

    const formattedTime = formatLocalDateTime(reminder_time, timezone);
    const isGroup = dbChat.chat_type !== 'private';

    if (event_time && reminder_time !== event_time) {
      const relativeNote = getRelativeTimeString(event_time, reminder_time);
      return `✅ <b>Reminder Set!</b>\n\n📌 <b>${title}</b>\n📅 Event: ${formatLocalDateTime(
        event_time,
        timezone
      )}\n🔔 Reminder: ${formattedTime} ${relativeNote ? `(${relativeNote})` : ''}\n👥 Target: ${
        isGroup ? dbChat.chat_title || 'Group Chat' : 'Private Chat'
      }`;
    }

    return `✅ <b>Reminder Scheduled!</b>\n\n📌 <b>${title}</b>\n📅 Time: ${formattedTime}\n${
      recurrence && recurrence !== 'none' ? `🔄 Recurrence: Every ${recurrence}\n` : ''
    }👥 Target: ${isGroup ? dbChat.chat_title || 'Group Chat' : 'Private Chat'}`;
  }

  /**
   * UPDATE REMINDER
   */
  static async handleUpdateReminder(
    dbChat: Chat,
    dbUser: User,
    aiPayload: AIExtractedPayload
  ): Promise<string> {
    const activeReminders = await DbRepository.getRemindersByChat(dbChat.id);

    if (activeReminders.length === 0) {
      return "You don't have any active reminders to update.";
    }

    const searchQuery = (aiPayload.search_query || aiPayload.title || '').toLowerCase();
    const matches = activeReminders.filter((r) => r.title.toLowerCase().includes(searchQuery));

    if (matches.length === 0) {
      return `I couldn't find any reminder matching "${searchQuery}". Use list command to view your active reminders.`;
    }

    if (matches.length > 1) {
      // Disambiguation
      const optionsText = matches
        .map((m, idx) => `${idx + 1}. ${m.title} (${formatLocalDateTime(m.reminder_time, dbChat.timezone)})`)
        .join('\n');

      await ContextManager.setPendingContext(dbChat.id, dbUser.id, 'SELECT_UPDATE_TARGET', {
        matches: matches.map((m) => m.id),
        new_time: aiPayload.reminder_time,
      });

      return `I found multiple matching reminders:\n\n${optionsText}\n\nPlease reply with the number of the reminder you wish to update.`;
    }

    const targetReminder = matches[0];
    const newTime = aiPayload.reminder_time || targetReminder.reminder_time;

    await DbRepository.updateReminder(targetReminder.id, {
      reminder_time: newTime,
      title: aiPayload.title && aiPayload.title !== searchQuery ? aiPayload.title : targetReminder.title,
    });

    return `✅ <b>Updated Reminder!</b>\n\n📌 <b>${targetReminder.title}</b>\n📅 New Time: ${formatLocalDateTime(
      newTime,
      dbChat.timezone
    )}`;
  }

  /**
   * CANCEL REMINDER
   */
  static async handleCancelReminder(
    dbChat: Chat,
    dbUser: User,
    aiPayload: AIExtractedPayload,
    userRole: 'creator' | 'administrator' | 'member' | 'left' | 'kicked' = 'member'
  ): Promise<string> {
    const activeReminders = await DbRepository.getRemindersByChat(dbChat.id);

    if (activeReminders.length === 0) {
      return 'There are no active reminders to cancel in this chat.';
    }

    const searchQuery = (aiPayload.search_query || aiPayload.title || '').toLowerCase();
    const matches = activeReminders.filter((r) => r.title.toLowerCase().includes(searchQuery));

    if (matches.length === 0) {
      return `I couldn't find any reminder matching "${searchQuery}".`;
    }

    const targetReminder = matches[0];

    // Group permission check: non-admin member cannot delete other member's reminder
    if (
      dbChat.chat_type !== 'private' &&
      targetReminder.created_by_user_id !== dbUser.id &&
      userRole !== 'administrator' &&
      userRole !== 'creator'
    ) {
      return "⚠️ <b>Permission Denied</b>: In group chats, you can only cancel reminders you created, unless you are a group administrator.";
    }

    await DbRepository.cancelReminder(targetReminder.id);

    return `✅ <b>Cancelled Reminder</b>\n\n📌 <b>${targetReminder.title}</b> has been cancelled.`;
  }

  /**
   * LIST REMINDERS
   */
  static async handleListReminders(dbChat: Chat): Promise<string> {
    const activeReminders = await DbRepository.getRemindersByChat(dbChat.id);

    if (activeReminders.length === 0) {
      return '📅 <b>UPCOMING REMINDERS</b>\n\nYou currently have no upcoming reminders.';
    }

    const isGroup = dbChat.chat_type !== 'private';
    let output = isGroup ? `👥 <b>GROUP REMINDERS</b>\n\n` : `📅 <b>UPCOMING REMINDERS</b>\n\n`;

    activeReminders.forEach((r, i) => {
      const timeStr = formatLocalDateTime(r.reminder_time, dbChat.timezone);
      output += `${i + 1}. 📌 <b>${r.title}</b>\n   ⏰ ${timeStr}${
        r.recurrence_type !== 'none' ? ` (🔄 ${r.recurrence_type})` : ''
      }\n\n`;
    });

    return output.trim();
  }

  /**
   * PROCESS DUE REMINDERS (IDEMPOTENT SCHEDULER ENGINE)
   */
  static async processDueReminders(): Promise<{ processed: number; success: number; failed: number }> {
    const dueInstances = await DbRepository.getDueInstances();
    let successCount = 0;
    let failedCount = 0;

    for (const inst of dueInstances) {
      // 1. Claim instance atomically to prevent duplicate sends across concurrent cron jobs
      const claimed = await DbRepository.claimInstance(inst.id);
      if (!claimed) continue; // Skip if claimed by another runner

      const reminder = inst.reminder;
      const chat = reminder.chat;
      const isGroup = chat.chat_type !== 'private';
      const timeText = formatLocalDateTime(reminder.reminder_time, chat.timezone);

      // 2. Deliver message via Messaging Provider
      const sent = await telegramProvider.sendNotification(
        chat.telegram_chat_id,
        reminder.title,
        timeText,
        isGroup,
        reminder.description || undefined
      );

      // 3. Log execution audit
      await DbRepository.logDelivery({
        reminder_id: reminder.id,
        instance_id: inst.id,
        telegram_chat_id: chat.telegram_chat_id,
        sent_at: new Date().toISOString(),
        delivery_status: sent ? 'success' : 'failed',
        error_message: sent ? null : 'Failed to deliver message via provider',
      });

      if (sent) {
        await DbRepository.markInstanceSent(inst.id);
        successCount++;
      } else {
        failedCount++;
      }
    }

    return {
      processed: dueInstances.length,
      success: successCount,
      failed: failedCount,
    };
  }
}
