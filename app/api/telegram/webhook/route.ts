import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate } from '@/types';
import { DbRepository } from '@/lib/database/repository';
import { ContextManager } from '@/lib/ai/contextManager';
import { parseUserMessage } from '@/lib/ai/aiService';
import { ReminderService } from '@/lib/reminders/reminderService';
import { telegramProvider } from '@/lib/telegram/telegramProvider';

export async function POST(req: NextRequest) {
  try {
    // Webhook secret validation if configured
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');

    if (
      webhookSecret &&
      !webhookSecret.includes('placeholder') &&
      headerSecret &&
      headerSecret !== webhookSecret
    ) {
      return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 });
    }

    const body: TelegramUpdate = await req.json();

    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true, message: 'Ignored non-text update' });
    }

    const telegramUser = message.from;
    const telegramChat = message.chat;
    const userText = message.text.trim();

    if (!telegramUser) {
      return NextResponse.json({ ok: true, message: 'Missing user metadata' });
    }

    // 1. Upsert User & Chat records
    const dbUser = await DbRepository.upsertUser({
      telegram_user_id: telegramUser.id,
      username: telegramUser.username,
      display_name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'User',
    });

    const dbChat = await DbRepository.upsertChat({
      telegram_chat_id: telegramChat.id,
      chat_type: telegramChat.type,
      title: telegramChat.title || [telegramUser.first_name, 'Private'].filter(Boolean).join(' '),
    });

    // 2. Check pending clarification context
    const pendingContext = await ContextManager.getPendingContext(dbChat.id, dbUser.id);

    // 3. Process with AI Agent / Command & Ack Parser
    const aiResult = await parseUserMessage({
      userText,
      chatType: dbChat.chat_type,
      timezone: dbChat.timezone,
      pendingContext,
    });

    let responseText = '';

    // 4. Execute Intent Action
    switch (aiResult.intent) {
      case 'GREETING': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        responseText = aiResult.conversational_response || 'Hi! 👋 What would you like me to remind you about?';
        break;
      }

      case 'COMMAND': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        if (userText.toLowerCase().startsWith('/cancel')) {
          responseText = 'Active conversation cancelled.';
        } else {
          responseText =
            "👋 Hi! I'm Remindly.\n\nI turn natural-language messages into reliable reminders.\n\nTry:\n• Remind me tomorrow at 6 PM to submit my assignment\n• Remind me in 10 minutes to call Rahul\n• Remind me every Monday at 9 AM to submit my report\n\nYou can also use me in Telegram groups.";
        }
        break;
      }

      case 'ACKNOWLEDGEMENT': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        const lower = userText.toLowerCase();
        if (lower.includes('thank') || lower.includes('thx')) {
          responseText = "You're welcome! 😊";
        } else {
          responseText = "Got it! 👍";
        }
        break;
      }

      case 'CREATE_REMINDER': {
        if (aiResult.needs_clarification && aiResult.clarification_question) {
          const contextType = aiResult.missing_field === 'title' ? 'AWAITING_TITLE' : 'AWAITING_TIME';
          await ContextManager.setPendingContext(dbChat.id, dbUser.id, contextType, {
            title: aiResult.title,
            event_time: aiResult.event_time,
            reminder_time: aiResult.reminder_time,
            time_type: aiResult.time_type,
          });
          responseText = aiResult.clarification_question;
        } else {
          // Terminal creation action: clear pending clarification context
          await ContextManager.clearContext(dbChat.id, dbUser.id);
          responseText = await ReminderService.handleCreateReminder(dbChat, dbUser, aiResult);
        }
        break;
      }

      case 'UPDATE_REMINDER': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        responseText = await ReminderService.handleUpdateReminder(dbChat, dbUser, aiResult);
        break;
      }

      case 'CANCEL_REMINDER': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        if (aiResult.title === 'cancel_active_context') {
          responseText = 'Active conversation cancelled.';
        } else {
          const userRole = await telegramProvider.getChatMemberRole(
            telegramChat.id,
            telegramUser.id
          );
          responseText = await ReminderService.handleCancelReminder(
            dbChat,
            dbUser,
            aiResult,
            userRole
          );
        }
        break;
      }

      case 'LIST_REMINDERS': {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        responseText = await ReminderService.handleListReminders(dbChat);
        break;
      }

      case 'CLARIFY': {
        if (aiResult.clarification_question) {
          const contextType = aiResult.missing_field === 'title' ? 'AWAITING_TITLE' : 'AWAITING_TIME';
          await ContextManager.setPendingContext(dbChat.id, dbUser.id, contextType, {
            title: aiResult.title,
            reminder_time: aiResult.reminder_time,
            time_type: aiResult.time_type,
          });
          responseText = aiResult.clarification_question;
        } else {
          responseText = 'Could you please specify when you would like me to set this reminder for?';
        }
        break;
      }

      case 'OUT_OF_SCOPE':
      default: {
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        responseText =
          "🤖 I'm Remindly, your AI reminder assistant. I can create, update, cancel, and manage reminders for you and your groups, but I can't help with that request.";
        break;
      }
    }

    // 5. Send Telegram Response
    await telegramProvider.sendMessage(telegramChat.id, responseText);

    return NextResponse.json({
      ok: true,
      intent: aiResult.intent,
      response: responseText,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
