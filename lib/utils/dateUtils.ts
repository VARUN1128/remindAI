import { format, parseISO, addHours, addDays, isPast, isBefore } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';

/**
 * Format ISO timestamp string into human-readable local time
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
 * Parse relative natural time expressions into ISO string
 * Handles terms like "tomorrow at 6 PM", "in 3 hours", "within 2mins", "after 2 minutes"
 */
export function parseRelativeDateText(
  text: string,
  timeZone: string = DEFAULT_TIMEZONE,
  referenceDate: Date = new Date()
): string | null {
  const lower = text.toLowerCase().trim();
  const zonedNow = toZonedTime(referenceDate, timeZone);

  // 1. Match relative seconds: "in 30 seconds", "within 30 secs", "after 10s"
  const inSecsMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:second|sec)s?\b/i);
  if (inSecsMatch) {
    const secs = parseInt(inSecsMatch[1], 10);
    const target = new Date(zonedNow.getTime() + secs * 1000);
    return formatInTimeZone(target, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }

  // 2. Match relative minutes: "within 2mins", "within 2 minutes", "in 2 minutes", "in 2 mins", "after 2 minutes"
  const inMinsMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:minute|min|m)s?\b/i);
  if (inMinsMatch) {
    const mins = parseInt(inMinsMatch[1], 10);
    const target = new Date(zonedNow.getTime() + mins * 60 * 1000);
    return formatInTimeZone(target, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }

  // 3. Match relative hours: "within 1 hour", "in 3 hours", "after 2 hrs"
  const inHoursMatch = lower.match(/(?:in|within|after)?\s*(\d+)\s*(?:hour|hr|h)s?\b/i);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1], 10);
    const target = addHours(zonedNow, hours);
    return formatInTimeZone(target, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }

  // 4. Match "tomorrow at 2 AM" or "tomorrow at 6 PM" or "tomorrow"
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

    const tomorrow = addDays(zonedNow, 1);
    tomorrow.setHours(hour, min, 0, 0);
    return formatInTimeZone(tomorrow, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
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
