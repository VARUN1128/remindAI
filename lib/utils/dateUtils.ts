import { format, parseISO, addDays, isPast } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';

/**
 * Format ISO timestamp string into human-readable local time in user's configured timezone
 */
export function formatLocalDateTime(
  isoString: string,
  timeZone: string = DEFAULT_TIMEZONE,
  dateFormatStr: string = 'EEEE, MMMM d, yyyy @ h:mm a'
): string {
  try {
    const date = parseISO(isoString);
    return formatInTimeZone(date, timeZone, dateFormatStr);
  } catch (error) {
    return isoString;
  }
}

/**
 * Check if given ISO string is in the past
 */
export function isTimeInPast(isoString: string): boolean {
  try {
    const date = parseISO(isoString);
    return isPast(date);
  } catch (e) {
    return false;
  }
}

/**
 * Get current time in specified timezone as ISO string with offset
 */
export function getCurrentISOString(timeZone: string = DEFAULT_TIMEZONE): string {
  const now = new Date();
  return formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Convert local wall-clock hour/minute into unambiguous absolute ISO timestamp in target timezone
 */
export function parseAbsoluteLocalTime(
  hour: number,
  minute: number,
  timeZone: string = DEFAULT_TIMEZONE,
  referenceInstant: Date = new Date(),
  dayOffset: number = 0
): string {
  // 1. Get local wall-clock components of referenceInstant in user's timezone
  const zonedNow = toZonedTime(referenceInstant, timeZone);

  // 2. Set target wall-clock hours & minutes
  const localTarget = new Date(zonedNow);
  localTarget.setHours(hour, minute, 0, 0);

  // 3. Handle day offset
  if (dayOffset > 0) {
    const shifted = addDays(localTarget, dayOffset);
    localTarget.setTime(shifted.getTime());
  } else if (dayOffset === 0 && localTarget.getTime() <= zonedNow.getTime()) {
    // If target clock time has already passed today in user's timezone, target tomorrow
    const shifted = addDays(localTarget, 1);
    localTarget.setTime(shifted.getTime());
  }

  // 4. Convert local wall-clock target back to true UTC instant
  const utcInstant = fromZonedTime(localTarget, timeZone);

  // 5. Format ISO string with timezone offset
  return formatInTimeZone(utcInstant, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Dynamically extract relative duration in seconds from natural text
 */
export function extractRelativeDuration(text: string): number | null {
  const lower = text.toLowerCase().trim();

  // 1. Match seconds: "in 30 seconds", "within 30 secs", "after 10s"
  const secsMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:second|sec|s)s?\b/i);
  if (secsMatch) {
    return parseInt(secsMatch[1], 10);
  }

  // 2. Match minutes: "within 2mins", "within 2 minutes", "in 2 minutes", "in 2 mins", "after 2 minutes"
  const minsMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:minute|min|m)s?\b/i);
  if (minsMatch) {
    return parseInt(minsMatch[1], 10) * 60;
  }

  // 3. Match hours: "within 1 hour", "in 3 hours", "after 2 hrs"
  const hoursMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:hour|hr|h)s?\b/i);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 3600;
  }

  // 4. Match days: "in 2 days", "after 3 days"
  const daysMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:day|d)s?\b/i);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10) * 86400;
  }

  return null;
}

/**
 * Calculate absolute instant from current instant + relative duration seconds
 */
export function calculateRelativeInstant(
  durationSeconds: number,
  referenceInstant: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  const targetInstant = new Date(referenceInstant.getTime() + durationSeconds * 1000);
  return formatInTimeZone(targetInstant, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Parse relative natural time expressions into structured timing info or ISO string
 */
export function parseRelativeDateText(
  text: string,
  timeZone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): { time_type: 'relative' | 'absolute'; duration_seconds?: number; reminder_time?: string } | null {
  const lower = text.toLowerCase().trim();

  // Check for dynamic relative duration
  const durationSecs = extractRelativeDuration(lower);
  if (durationSecs !== null) {
    return {
      time_type: 'relative',
      duration_seconds: durationSecs,
      reminder_time: calculateRelativeInstant(durationSecs, referenceDate, timeZone),
    };
  }

  // Check for "tomorrow" expressions
  if (lower.includes('tomorrow')) {
    let hour = 9; // Default 9 AM if no time specified
    let min = 0;

    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();
      if (meridiem === 'pm' && h < 12) h += 12;
      if (meridiem === 'am' && h === 12) h = 0;
      hour = h;
      min = m;
    }

    const iso = parseAbsoluteLocalTime(hour, min, timeZone, referenceDate, 1);
    return {
      time_type: 'absolute',
      reminder_time: iso,
    };
  }

  return null;
}

/**
 * Parse absolute clock time expressions ("at 3 AM", "2:00 PM") in user's configured timezone
 */
export function parseTimeInput(
  input: string,
  referenceDate: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): { time_type: 'absolute' | 'relative'; duration_seconds?: number | null; reminder_time: string } | null {
  const lower = input.toLowerCase().trim();

  // If input is a relative duration phrase (min, sec, hr), ignore absolute clock parsing
  if (lower.match(/\b(?:min|minute|sec|second|hr|hour)s?\b/i)) {
    return null;
  }

  // Match absolute time like "at 2 AM", "2:00 AM", "7 PM", "2 AM"
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(pm|am)\b/i) || lower.match(/\b(\d{1,2}):(\d{2})\b/);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    const iso = parseAbsoluteLocalTime(hour, min, timeZone, referenceDate, 0);
    return {
      time_type: 'absolute',
      reminder_time: iso,
    };
  }

  return null;
}

/**
 * Format relative duration string for notifications (e.g. "starts in 2 hours")
 */
export function getRelativeTimeString(
  eventIso: string,
  reminderIso: string
): string {
  try {
    const eventDate = parseISO(eventIso);
    const reminderDate = parseISO(reminderIso);
    const diffMs = eventDate.getTime() - reminderDate.getTime();
    if (diffMs <= 0) return '';

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours === 1) return 'in 1 hour';
    if (diffHours > 1 && diffHours < 24) return `in ${diffHours} hours`;

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'tomorrow';
    if (diffDays > 1) return `in ${diffDays} days`;

    return '';
  } catch (e) {
    return '';
  }
}

export interface ExtractedPurposeAndTiming {
  purpose: string | null;
  timing: {
    time_type: 'relative' | 'absolute';
    duration_seconds?: number;
    reminder_time: string;
  } | null;
}

/**
 * Dynamically extract PURPOSE and TIMING regardless of sentence word order
 */
export function extractPurposeAndTiming(
  text: string,
  timeZone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): ExtractedPurposeAndTiming {
  const lower = text.toLowerCase().trim();

  // 1. Check for dynamic relative duration
  const relativeMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:second|sec|s|minute|min|m|hour|hr|h|day|d)s?\b/i);
  let timing: ExtractedPurposeAndTiming['timing'] = null;
  let textWithoutTime = text;

  if (relativeMatch) {
    const durationSecs = extractRelativeDuration(relativeMatch[0]);
    if (durationSecs !== null) {
      timing = {
        time_type: 'relative',
        duration_seconds: durationSecs,
        reminder_time: calculateRelativeInstant(durationSecs, referenceDate, timeZone),
      };
      textWithoutTime = text.replace(new RegExp(relativeMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
    }
  } else {
    // 2. Check for absolute clock / date expressions
    const dateWordMatch = lower.match(/\b(today|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i);
    const clockMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || lower.match(/\b(\d{1,2}):(\d{2})\b/);

    if (clockMatch || dateWordMatch) {
      let dayOffset = 0;
      if (dateWordMatch) {
        if (dateWordMatch[1].toLowerCase() === 'tomorrow') {
          dayOffset = 1;
        }
      }

      let hour = 9;
      let min = 0;

      if (clockMatch) {
        let h = parseInt(clockMatch[1], 10);
        const m = clockMatch[2] ? parseInt(clockMatch[2], 10) : 0;
        const meridiem = clockMatch[3]?.toLowerCase();
        if (meridiem === 'pm' && h < 12) h += 12;
        if (meridiem === 'am' && h === 12) h = 0;
        hour = h;
        min = m;
      }

      const iso = parseAbsoluteLocalTime(hour, min, timeZone, referenceDate, dayOffset);
      timing = {
        time_type: 'absolute',
        reminder_time: iso,
      };

      textWithoutTime = text
        .replace(/\b(today|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/gi, '')
        .replace(/(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
        .replace(/\b\d{1,2}:\d{2}\b/g, '');
    }
  }

  // Clean remaining purpose text
  let cleaned = textWithoutTime
    .replace(/^(please\s+)?remind\s+(me|us|everyone)\s+/i, '')
    .replace(/^don't\s+(let\s+me\s+)?forget\s+(to\s+)?/i, '')
    .replace(/^remind\s+/i, '')
    .replace(/^to\s+/i, '')
    .replace(/\s+(remind\s+me|remind\s+us|remind\s+everyone)\s+/i, ' ')
    .replace(/\s+to\s+remind\s+me\s+/i, ' ')
    .replace(/\s+(at|on|in|within|after|today|tomorrow)\s*$/i, '')
    .trim();

  cleaned = cleaned.replace(/^(to|about|for|that)\s+/i, '').trim();

  let purpose: string | null = null;
  if (cleaned.length > 0 && !cleaned.toLowerCase().match(/^(remind|me|to)$/)) {
    purpose = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return {
    purpose,
    timing,
  };
}
