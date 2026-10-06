import { AIExtractedPayload } from '@/types';
import {
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
  if (pendingContext && pendingContext.context_type === 'AWAITING_TIME') {
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

  // UPDATE REMINDER
  if (lower.startsWith('move') || lower.startsWith('update') || lower.startsWith('change')) {
    const query = text;
    return {
      intent: 'UPDATE_REMINDER',
      title: query,
      search_query: query,
      timezone,
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // MISSING TIME CLARIFICATION
  if (
    (lower.includes('meeting friday evening') ||
      lower === 'remind me about the meeting' ||
      lower.includes('remind me about the assignment')) &&
    !lower.match(/\d{1,2}\s*(pm|am|:00)/i) &&
    !lower.match(/\b(in|within|after)\b/i)
  ) {
    let question = 'When would you like me to remind you?';
    if (lower.includes('meeting friday evening')) {
      question = 'What time is the meeting on Friday evening?';
    } else if (lower.includes('assignment')) {
      question = 'What date and time would you like to be reminded about the assignment?';
    }
    return {
      intent: 'CLARIFY',
      title: lower.includes('meeting') ? 'Meeting' : 'Assignment',
      timezone,
      needs_clarification: true,
      clarification_question: question,
      missing_field: 'time',
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

  // RELATIVE BEFORE EVENT ("Meeting Friday at 4 PM. Remind me 2 hours before.")
  if (lower.includes('2 hours before') || lower.includes('before')) {
    const friday4PM = getNextWeekdayTime(5, 16, 0, timezone, now);
    const friday2PM = getNextWeekdayTime(5, 14, 0, timezone, now);

    return {
      intent: 'CREATE_REMINDER',
      title: 'Meeting',
      event_time: friday4PM,
      reminder_time: friday2PM,
      time_type: 'absolute',
      timezone,
      recurrence: 'none',
      target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // NORMAL REMINDER ("Remind me tomorrow at 6 PM to submit my assignment")
  if (lower.includes('tomorrow at 6') || (lower.includes('tomorrow') && lower.includes('6'))) {
    const tomorrow6PMObj = parseRelativeDateText('tomorrow at 6 PM', timezone, now);
    const timeVal = tomorrow6PMObj?.reminder_time || getCurrentISOString(timezone);
    return {
      intent: 'CREATE_REMINDER',
      title: 'Submit assignment',
      event_time: timeVal,
      reminder_time: timeVal,
      time_type: 'absolute',
      timezone,
      recurrence: 'none',
      target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // GROUP REMINDER ("Guys, presentation Friday at 10 AM. Remind everyone Thursday evening")
  if (lower.includes('presentation friday') || lower.includes('remind everyone')) {
    const thursday7PM = getNextWeekdayTime(4, 19, 0, timezone, now);
    const friday10AM = getNextWeekdayTime(5, 10, 0, timezone, now);

    return {
      intent: 'CREATE_REMINDER',
      title: 'Project Presentation',
      event_time: friday10AM,
      reminder_time: thursday7PM,
      time_type: 'absolute',
      timezone,
      recurrence: 'none',
      target: 'GROUP',
      needs_clarification: false,
      clarification_question: null,
    };
  }

  // Generic relative or absolute date parsing fallback
  const parsedTimeObj =
    parseRelativeDateText(text, timezone, now) || parseTimeInput(text, now, timezone);
  const titleStr = extractTitle(text);

  if (!parsedTimeObj && !lower.includes('list')) {
    return {
      intent: 'CLARIFY',
      title: titleStr || 'Task',
      timezone,
      needs_clarification: true,
      clarification_question: 'When would you like me to set this reminder for?',
      missing_field: 'time',
    };
  }

  const finalTime = parsedTimeObj?.reminder_time || getCurrentISOString(timezone);

  return {
    intent: 'CREATE_REMINDER',
    title: titleStr || 'Reminder',
    event_time: finalTime,
    reminder_time: finalTime,
    time_type: parsedTimeObj?.time_type || 'absolute',
    duration_seconds: parsedTimeObj?.duration_seconds || null,
    timezone,
    recurrence: 'none',
    target: chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP',
    needs_clarification: false,
    clarification_question: null,
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

function extractTitle(text: string): string {
  const toMatch = text.match(/\bto\s+(.+)$/i);
  if (toMatch) {
    return toMatch[1].trim().charAt(0).toUpperCase() + toMatch[1].trim().slice(1);
  }

  let cleaned = text
    .replace(/^remind\s+(me|everyone|us)\s+/i, '')
    .replace(/^don't let me forget to\s+/i, '')
    .replace(/^to\s+/i, '');

  const atPos = cleaned.search(
    /\s+(at|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|on|in|within|after)\s+/i
  );
  if (atPos > 0) {
    cleaned = cleaned.substring(0, atPos);
  }
  cleaned = cleaned.trim();
  if (!cleaned) cleaned = 'Reminder';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
