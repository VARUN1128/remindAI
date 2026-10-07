import { MessagingProvider } from '@/types';
import { messagingRegistry } from '@/lib/messaging/messagingProvider';

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const isTelegramConfigured = Boolean(
  botToken && !botToken.includes('placeholder') && !botToken.includes('your_')
);

export class TelegramProvider implements MessagingProvider {
  public name = 'telegram';

  /**
   * Send text message to Telegram Chat
   */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (process.env.DEMO_MODE === 'true' || !isTelegramConfigured) {
      console.log(`[DEMO TELEGRAM BOT -> Chat ${chatId}]:\n${text}`);
      return true;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        console.error('Telegram API error:', data);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return false;
    }
  }

  /**
   * Send formatted reminder notification
   */
  async sendNotification(
    chatId: number | string,
    title: string,
    timeText: string,
    isGroup: boolean,
    extraInfo?: string
  ): Promise<boolean> {
    let text = '';

    if (isGroup) {
      text = `👥 <b>Group Reminder</b>\n\n<b>${title}</b>\n\nIt is time for your reminder.`;
    } else {
      text = `🔔 <b>Reminder</b>\n\n<b>${title}</b>\n\nIt is time for your reminder.`;
    }

    return this.sendMessage(chatId, text);
  }

  /**
   * Check user role in group chat (creator, admin, member)
   */
  async getChatMemberRole(
    chatId: number | string,
    userId: number | string
  ): Promise<'creator' | 'administrator' | 'member' | 'left' | 'kicked'> {
    if (process.env.DEMO_MODE === 'true' || !isTelegramConfigured) {
      return 'administrator'; // Grant admin in demo mode
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
        }),
      });

      const data = await response.json();
      if (data.ok && data.result) {
        return data.result.status;
      }
      return 'member';
    } catch (e) {
      return 'member';
    }
  }
}

export const telegramProvider = new TelegramProvider();
messagingRegistry.register(telegramProvider);
