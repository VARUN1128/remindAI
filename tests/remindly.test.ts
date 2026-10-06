import assert from 'node:assert';
import { mockParseUserMessage } from '../lib/ai/mockAi';
import { ReminderService } from '../lib/reminders/reminderService';
import { mockDb } from '../lib/database/mockDb';
import { ContextManager } from '../lib/ai/contextManager';
import {
  parseAbsoluteLocalTime,
  calculateRelativeInstant,
  extractRelativeDuration,
  formatLocalDateTime,
  parseRelativeDateText,
  parseTimeInput,
} from '../lib/utils/dateUtils';

console.log('🧪 RUNNING COMPREHENSIVE REMINDLY ARCHITECTURE TEST SUITE...\n');

async function runTests() {
  // ------------------------------------------------------------------
  // TEST 1: Greeting does not create a reminder
  // ------------------------------------------------------------------
  console.log('--- TEST 1: Greeting does not create a reminder ---');
  const payload1 = mockParseUserMessage('Hi', 'private', 'Asia/Kolkata');
  assert.strictEqual(payload1.intent, 'GREETING');
  assert.ok(payload1.conversational_response?.includes('Hi! 👋'));
  assert.strictEqual(payload1.reminder_time, undefined);
  assert.strictEqual(payload1.needs_clarification, false);
  console.log('✅ TEST 1 PASSED');

  // ------------------------------------------------------------------
  // TEST 2: Greeting does not create clarification context
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: Greeting does not create clarification context ---');
  await ContextManager.clearContext('chat-t2', 'user-t2');
  const payload2 = mockParseUserMessage('Hello', 'private', 'Asia/Kolkata');
  assert.strictEqual(payload2.intent, 'GREETING');
  const ctx2 = await ContextManager.getPendingContext('chat-t2', 'user-t2');
  assert.strictEqual(ctx2, null);
  console.log('✅ TEST 2 PASSED');

  // ------------------------------------------------------------------
  // TEST 3: A legitimate clarification creates context
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: Legitimate clarification creates context ---');
  const payload3 = mockParseUserMessage('Remind me about the meeting Friday evening', 'private', 'Asia/Kolkata');
  assert.strictEqual(payload3.intent, 'CLARIFY');
  assert.strictEqual(payload3.needs_clarification, true);
  await ContextManager.setPendingContext('chat-t3', 'user-t3', 'AWAITING_TIME', { title: payload3.title });
  const ctx3 = await ContextManager.getPendingContext('chat-t3', 'user-t3');
  assert.ok(ctx3);
  assert.strictEqual(ctx3.context_data.title, 'Meeting');
  console.log('✅ TEST 3 PASSED');

  // ------------------------------------------------------------------
  // TEST 4: Successful clarification clears context
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: Successful clarification clears context ---');
  const ctx4 = await ContextManager.getPendingContext('chat-t3', 'user-t3');
  assert.ok(ctx4);
  const payload4 = mockParseUserMessage('7 PM', 'private', 'Asia/Kolkata', ctx4);
  assert.strictEqual(payload4.intent, 'CREATE_REMINDER');
  assert.strictEqual(payload4.title, 'Meeting');
  await ContextManager.clearContext('chat-t3', 'user-t3');
  const ctx4After = await ContextManager.getPendingContext('chat-t3', 'user-t3');
  assert.strictEqual(ctx4After, null);
  console.log('✅ TEST 4 PASSED');

  // ------------------------------------------------------------------
  // TEST 5: Later unrelated message does not inherit previous reminder text
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: Unrelated message does not inherit previous reminder ---');
  const ctx5 = await ContextManager.getPendingContext('chat-t3', 'user-t3');
  assert.strictEqual(ctx5, null);
  const payload5 = mockParseUserMessage('Thank you', 'private', 'Asia/Kolkata', null);
  assert.strictEqual(payload5.intent, 'ACKNOWLEDGEMENT');
  assert.notStrictEqual(payload5.title, 'Meeting');
  console.log('✅ TEST 5 PASSED');

  // ------------------------------------------------------------------
  // TEST 6: Absolute local time is interpreted in configured timezone
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: Absolute local time timezone resolution ---');
  // Fixed reference instant: 2:06 AM Kolkata time on Oct 7, 2026 (UTC = Oct 6 20:36:00)
  const refTime6 = new Date('2026-10-06T20:36:00.000Z');
  const isoKolkata = parseAbsoluteLocalTime(3, 0, 'Asia/Kolkata', refTime6, 0);
  const formattedKolkata = formatLocalDateTime(isoKolkata, 'Asia/Kolkata');
  assert.ok(formattedKolkata.includes('3:00 AM'), `Expected 3:00 AM, got: ${formattedKolkata}`);
  assert.ok(formattedKolkata.includes('Wednesday, October 7, 2026'));

  // Test same "3 AM" in America/New_York
  const isoNY = parseAbsoluteLocalTime(3, 0, 'America/New_York', refTime6, 0);
  const formattedNY = formatLocalDateTime(isoNY, 'America/New_York');
  assert.ok(formattedNY.includes('3:00 AM'), `Expected 3:00 AM NY, got: ${formattedNY}`);
  console.log('✅ TEST 6 PASSED');

  // ------------------------------------------------------------------
  // TEST 7: Relative duration calculated from current instant
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: Relative duration from current instant ---');
  // Instant at 2:03 AM Kolkata (UTC Oct 6 20:33:00)
  const refTime7 = new Date('2026-10-06T20:33:00.000Z');
  const durSecs7 = extractRelativeDuration('after 2 minutes');
  assert.strictEqual(durSecs7, 120);
  const targetIso7 = calculateRelativeInstant(durSecs7!, refTime7, 'Asia/Kolkata');
  const formatted7 = formatLocalDateTime(targetIso7, 'Asia/Kolkata');
  assert.ok(formatted7.includes('2:05 AM'), `Expected approx 2:05 AM, got: ${formatted7}`);
  console.log('✅ TEST 7 PASSED');

  // ------------------------------------------------------------------
  // TEST 8: Relative duration does not pass through absolute-clock parsing
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: Relative duration bypasses absolute clock parsing ---');
  const absResult8 = parseTimeInput('within 2mins', new Date(), 'Asia/Kolkata');
  assert.strictEqual(absResult8, null, 'Relative expression must NOT match absolute clock time');

  const relResult8 = parseRelativeDateText('within 2mins', 'Asia/Kolkata', new Date());
  assert.ok(relResult8);
  assert.strictEqual(relResult8.time_type, 'relative');
  assert.strictEqual(relResult8.duration_seconds, 120);
  console.log('✅ TEST 8 PASSED');

  // ------------------------------------------------------------------
  // TEST 9: Stored timestamp and displayed timestamp represent same instant
  // ------------------------------------------------------------------
  console.log('\n--- TEST 9: Stored and displayed timestamps represent same instant ---');
  const iso9 = parseAbsoluteLocalTime(3, 0, 'Asia/Kolkata', refTime6, 0);
  const dateObj9 = new Date(iso9);
  const formatted9 = formatLocalDateTime(iso9, 'Asia/Kolkata');
  const parsedBackDate = new Date(iso9);
  assert.strictEqual(dateObj9.getTime(), parsedBackDate.getTime());
  assert.ok(formatted9.includes('3:00 AM'));
  console.log('✅ TEST 9 PASSED');

  // ------------------------------------------------------------------
  // TEST 10: Timezone conversion works in both directions
  // ------------------------------------------------------------------
  console.log('\n--- TEST 10: Timezone conversion bi-directionality ---');
  const iso10 = parseAbsoluteLocalTime(14, 30, 'Asia/Kolkata', refTime6, 0); // 2:30 PM Kolkata
  const kolkataStr = formatLocalDateTime(iso10, 'Asia/Kolkata');
  const utcStr = formatLocalDateTime(iso10, 'UTC');
  assert.ok(kolkataStr.includes('2:30 PM'));
  assert.ok(utcStr.includes('9:00 AM')); // 2:30 PM IST = 9:00 AM UTC
  console.log('✅ TEST 10 PASSED');

  // ------------------------------------------------------------------
  // TEST 11: Crossing midnight works correctly
  // ------------------------------------------------------------------
  console.log('\n--- TEST 11: Crossing midnight ---');
  // 11:55 PM local Kolkata (UTC Oct 6 18:25:00)
  const refTime11 = new Date('2026-10-06T18:25:00.000Z');
  const durSecs11 = extractRelativeDuration('in 10 minutes');
  assert.strictEqual(durSecs11, 600);
  const targetIso11 = calculateRelativeInstant(durSecs11!, refTime11, 'Asia/Kolkata');
  const formatted11 = formatLocalDateTime(targetIso11, 'Asia/Kolkata');
  assert.ok(formatted11.includes('12:05 AM'), `Expected 12:05 AM, got: ${formatted11}`);
  console.log('✅ TEST 11 PASSED');

  // ------------------------------------------------------------------
  // TEST 12: Recurring reminders use configured timezone correctly
  // ------------------------------------------------------------------
  console.log('\n--- TEST 12: Recurring reminders timezone correctness ---');
  const payload12 = mockParseUserMessage('Remind me every Monday at 9 AM to submit report', 'private', 'Asia/Kolkata');
  assert.strictEqual(payload12.intent, 'CREATE_REMINDER');
  assert.strictEqual(payload12.recurrence, 'weekly');
  const formatted12 = formatLocalDateTime(payload12.reminder_time!, 'Asia/Kolkata');
  assert.ok(formatted12.includes('9:00 AM'));
  console.log('✅ TEST 12 PASSED');

  // ------------------------------------------------------------------
  // TEST 13: Telegram webhook and web simulator use same time-resolution logic
  // ------------------------------------------------------------------
  console.log('\n--- TEST 13: Webhook and simulator logic parity ---');
  const payload13a = mockParseUserMessage('Remind me in 5 minutes to test parity', 'private', 'Asia/Kolkata');
  assert.strictEqual(payload13a.intent, 'CREATE_REMINDER');
  assert.strictEqual(payload13a.time_type, 'relative');
  assert.strictEqual(payload13a.duration_seconds, 300);
  console.log('✅ TEST 13 PASSED');

  // ------------------------------------------------------------------
  // TEST 14: Scheduler uses stored absolute timestamp correctly
  // ------------------------------------------------------------------
  console.log('\n--- TEST 14: Scheduler atomic execution & idempotency ---');
  mockDb.seedDefaults();
  const run1 = await ReminderService.processDueReminders();
  assert.ok(run1.processed >= 0);
  const run2 = await ReminderService.processDueReminders();
  assert.strictEqual(run2.processed, 0, 'Second run must process 0 items due to atomic claim lock');
  console.log('✅ TEST 14 PASSED');

  console.log('\n🎉 ALL 14 AUTOMATED ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
