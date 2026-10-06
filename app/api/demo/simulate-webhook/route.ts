import { NextRequest, NextResponse } from 'next/server';
import { DbRepository } from '@/lib/database/repository';
import { ContextManager } from '@/lib/ai/contextManager';
import { parseUserMessage } from '@/lib/ai/aiService';
import { ReminderService } from '@/lib/reminders/reminderService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      chatType = 'private',
      userId = 123456789,
      chatId = chatType === 'group' ? -1001987654321 : 123456789,
      displayName = 'Alex Johnson',
      username = 'alex_student',
      chatTitle = chatType === 'group' ? '🚀 CS401 Senior Project Team' : 'Alex Johnson (Private)',
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text message is required' }, { status: 400 });
    }

    // 1. Upsert User & Chat
    const dbUser = await DbRepository.upsertUser({
      telegram_user_id: userId,
      username,
      display_name: displayName,
    });

    const dbChat = await DbRepository.upsertChat({
      telegram_chat_id: chatId,
      chat_type: chatType,
      title: chatTitle,
    });

    // 2. Check pending clarification context
    const pendingContext = await ContextManager.getPendingContext(dbChat.id, dbUser.id);

    // 3. AI Intent Extraction
    const aiResult = await parseUserMessage({
      userText: text,
      chatType: dbChat.chat_type,
      timezone: dbChat.timezone,
      pendingContext,
    });

    if (pendingContext) {
      await ContextManager.clearContext(dbChat.id, dbUser.id);
    }

    let responseText = '';

    // 4. Action Execution
    switch (aiResult.intent) {
      case 'GREETING': {
        responseText = aiResult.conversational_response || 'Hi! 👋 What would you like me to remind you about?';
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'COMMAND': {
        responseText = aiResult.conversational_response || "👋 Hi! I'm Remindly.\n\nI turn natural-language messages into reliable reminders.\n\nTry:\n• Remind me tomorrow at 6 PM to submit my assignment\n• Remind me in 10 minutes to call Rahul\n• Remind me every Monday at 9 AM to submit my report\n\nYou can also use me in Telegram groups.";
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'ACKNOWLEDGEMENT': {
        responseText = aiResult.conversational_response || "You're welcome! 😊";
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'CREATE_REMINDER': {
        if (aiResult.needs_clarification && aiResult.clarification_question) {
          await ContextManager.setPendingContext(dbChat.id, dbUser.id, 'AWAITING_TIME', {
            title: aiResult.title,
            event_time: aiResult.event_time,
          });
          responseText = aiResult.clarification_question;
        } else {
          responseText = await ReminderService.handleCreateReminder(dbChat, dbUser, aiResult);
          await ContextManager.clearContext(dbChat.id, dbUser.id);
        }
        break;
      }

      case 'UPDATE_REMINDER': {
        responseText = await ReminderService.handleUpdateReminder(dbChat, dbUser, aiResult);
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'CANCEL_REMINDER': {
        responseText = await ReminderService.handleCancelReminder(
          dbChat,
          dbUser,
          aiResult,
          'administrator'
        );
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'LIST_REMINDERS': {
        responseText = await ReminderService.handleListReminders(dbChat);
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }

      case 'CLARIFY': {
        if (aiResult.clarification_question) {
          await ContextManager.setPendingContext(dbChat.id, dbUser.id, 'AWAITING_TIME', {
            title: aiResult.title,
          });
          responseText = aiResult.clarification_question;
        } else {
          responseText = 'When would you like me to set this reminder for?';
        }
        break;
      }

      case 'OUT_OF_SCOPE':
      default: {
        responseText =
          "🤖 I'm Remindly, your AI reminder assistant. I can create, update, cancel, and manage reminders for you and your groups, but I can't help with that request.";
        await ContextManager.clearContext(dbChat.id, dbUser.id);
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      text,
      response: responseText,
      extractedJSON: aiResult,
      chat: dbChat,
      user: dbUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
