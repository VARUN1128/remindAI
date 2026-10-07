import { AIExtractedPayload } from '@/types';
import {
  extractPurposeAndTiming,
  parseRelativeDateText,
  parseTimeInput,
  parseAbsoluteLocalTime,
  calculateRelativeInstant,
  getCurrentISOString,
  DEFAULT_TIMEZONE,
} from '@/lib/utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';

/**
 * Deterministic Mock AI Parser for DEMO_MODE execution and fallback
 */
export function mockParseUserMessage(
  userText: string,
  chatType: 'private' | 'group' | 'supergroup',
  timezone: string = DEFAULT_TIMEZONE,
  pendingContext?: any
): AIExtractedPayload {
  const text = userText.trim();
  const lower = text.toLowerCase();
  const now = new Date();

  // 1. Handle Slash Commands (/start, /help, /cancel)
  if (text.startsWith('/')) {
    const cmd = text.split(' ')[0].toLowerCase();
    if (cmd === '/start' || cmd === '/help') {
      return {
        intent: 'COMMAND',
        title: cmd,
        timezone,
        needs_clarification: false,
        clarification_question: null,
        conversational_response:
          "👋 Hi! I'm Remindly.\n\nI turn natural-language messages into reliable reminders.\n\nTry:\n• Remind me tomorrow at 6 PM to submit my assignment\n• Remind me in 10 minutes to call Rahul\n• Remind me every Monday at 9 AM to submit my report\n\nYou can also use me in Telegram groups.",
      };
    }
    if (cmd === '/cancel') {
      return {
        intent: 'CANCEL_REMINDER',
        title: 'cancel_active_context',
        timezone,
        needs_clarification: false,
        clarification_question: null,
        conversational_response: 'Action cancelled. Let me know if you need anything else! 😊',
      };
    }
  }

  const cleanedMsg = lower.replace(/[^\w\s]/g, '').trim();

  // 2. Greetings ("hi", "hello", "hey", "good morning", etc.)
  const greetingPhrases = [
    'hi',
    'hello',
    'hey',
    'hey there',
    'good morning',
    'good afternoon',
    'good evening',
    'yo',
    'hi there',
    'greetings',
  ];
  if (greetingPhrases.includes(cleanedMsg)) {
    return {
      intent: 'GREETING',
      title: cleanedMsg,
      timezone,
      needs_clarification: false,
      clarification_question: null,
      conversational_response: 'Hi! 👋 What would you like me to remind you about?',
    };
  }

  // 3. Conversational Acknowledgements ("thanks", "thank you", "okay", "ok", "great", "done")
  const ackPhrases = [
    'thanks',
    'thank you',
    'thankyou',
    'thx',
    'okay',
    'ok',
    'great',
    'perfect',
    'got it',
    'done',
    'cool',
    'awesome',
    'alright',
  ];
  if (ackPhrases.includes(cleanedMsg)) {
    return {
      intent: 'ACKNOWLEDGEMENT',
      title: cleanedMsg,
      timezone,
      needs_clarification: false,
      clarification_question: null,
      conversational_response: "You're welcome! 😊",
    };
  }

  // 4. Handle multi-turn clarification answer if pending context exists
  if (pendingContext) {
    if (pendingContext.context_type === 'AWAITING_TIME') {
      const parsedTimeObj =
        parseRelativeDateText(text, timezone, now) || parseTimeInput(text, now, timezone);

      if (parsedTimeObj && parsedTimeObj.reminder_time) {
        return {
          intent: 'CREATE_REMINDER',
          title: pendingContext.context_data.title || 'Reminder',
          event_time: pendingContext.context_data.event_time || parsedTimeObj.reminder_time,
          reminder_time: parsedTimeObj.reminder_time,
          time_type: parsedTimeObj.time_type,
          duration_seconds: parsedTimeObj.duration_seconds || null,
          timezone,
          recurrence: 'none',
          target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
          needs_clarification: false,
          clarification_question: null,
        };
      }
    } else if (pendingContext.context_type === 'AWAITING_TITLE') {
      const purpose = text.trim();
      if (purpose) {
        return {
          intent: 'CREATE_REMINDER',
          title: purpose.charAt(0).toUpperCase() + purpose.slice(1),
          event_time: pendingContext.context_data.reminder_time,
          reminder_time: pendingContext.context_data.reminder_time,
          time_type: pendingContext.context_data.time_type || 'absolute',
          timezone,
          recurrence: 'none',
          target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
          needs_clarification: false,
          clarification_question: null,
        };
      }
    }
  }

  // OUT OF SCOPE
  if (
    lower.includes('python scraper') ||
    lower.includes('write code') ||
    lower.includes('weather') ||
    lower.includes('who are you') ||
    lower.includes('tell me a joke')
  ) {
    return {
      intent: 'OUT_OF_SCOPE',
      timezone,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // LIST REMINDERS
  if (
    lower.includes('what reminders') ||
    lower.includes('show reminders') ||
    lower.includes('list reminders') ||
    lower.includes('what do i have')
  ) {
    return {
      intent: 'LIST_REMINDERS',
      timezone,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // CANCEL REMINDER
  if (lower.startsWith('cancel') || lower.startsWith('delete') || lower.includes('cancel reminder')) {
    const query = text.replace(/^(cancel|delete)\s+/i, '').replace(/reminder/i, '').trim();
    return {
      intent: 'CANCEL_REMINDER',
      title: query,
      search_query: query,
      timezone,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // RECURRING REMINDERS ("Every Monday at 9 AM")
  if (lower.includes('every monday') || lower.includes('every day') || lower.includes('every week')) {
    const titleMatch = text.match(/to\s+(.+)$/i) || text.match(/remind me\s+(.+?)\s+every/i);
    const titleStr = titleMatch ? titleMatch[1] : 'Recurring task';

    const nextMonday9AM = getNextWeekdayTime(1, 9, 0, timezone, now);
    return {
      intent: 'CREATE_REMINDER',
      title: titleStr.charAt(0).toUpperCase() + titleStr.slice(1),
      event_time: null,
      reminder_time: nextMonday9AM,
      time_type: 'recurring',
      timezone,
      recurrence: 'weekly',
      target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // DYNAMIC PURPOSE & TIMING EXTRACTION
  const extracted = extractPurposeAndTiming(text, timezone, now);

  // Both Purpose and Timing exist -> Create Reminder Immediately
  if (extracted.purpose && extracted.timing) {
    return {
      intent: 'CREATE_REMINDER',
      title: extracted.purpose,
      event_time: extracted.timing.reminder_time,
      reminder_time: extracted.timing.reminder_time,
      time_type: extracted.timing.time_type,
      duration_seconds: extracted.timing.duration_seconds || null,
      timezone,
      recurrence: 'none',
      target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // Purpose exists BUT Time is missing -> Ask for Time
  if (extracted.purpose && !extracted.timing) {
    return {
      intent: 'CLARIFY',
      title: extracted.purpose,
      timezone,
      needs_clarification: true,
      clarification_question: 'When would you like me to set this reminder for?',
      missing_field: 'time',
    };
  }

  // Time exists BUT Purpose is missing -> Ask for Purpose
  if (!extracted.purpose && extracted.timing) {
    return {
      intent: 'CLARIFY',
      event_time: extracted.timing.reminder_time,
      reminder_time: extracted.timing.reminder_time,
      time_type: extracted.timing.time_type,
      timezone,
      needs_clarification: true,
      clarification_question: 'What would you like me to remind you about?',
      missing_field: 'title',
    };
  }

  // Fallback -> Ask for clarification
  return {
    intent: 'CLARIFY',
    title: 'Reminder',
    timezone,
    needs_clarification: true,
    clarification_question: 'When would you like me to set this reminder for?',
    missing_field: 'time',
  };
}

function getNextWeekdayTime(
  targetDayOfWeek: number,
  hour: number,
  min: number,
  timeZone: string,
  referenceInstant: Date = new Date()
): string {
  const zonedNow = toZonedTime(referenceInstant, timeZone);
  const currentDay = zonedNow.getDay();
  let daysToAdd = (targetDayOfWeek - currentDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;

  return parseAbsoluteLocalTime(hour, min, timeZone, referenceInstant, daysToAdd);
}
