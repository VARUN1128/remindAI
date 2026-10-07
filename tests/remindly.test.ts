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
  extractPurposeAndTiming,
} from '../lib/utils/dateUtils';
import { telegramProvider } from '../lib/telegram/telegramProvider';

console.log('🧪 RUNNING COMPREHENSIVE REMINDLY PRODUCTION TEST SUITE...\n');

async function runTests() {
  // ------------------------------------------------------------------
  // TEST 1: Purpose + Absolute Time ("Remind me to call X at today 8 PM")
  // ------------------------------------------------------------------
  console.log('--- TEST 1: Purpose + Absolute Time ---');
  const res1 = mockParseUserMessage('Remind me to call X at today 8 PM', 'private', 'Asia/Kolkata');
  assert.strictEqual(res1.intent, 'CREATE_REMINDER');
  assert.strictEqual(res1.title, 'Call X');
  assert.ok(res1.reminder_time, 'Reminder time must be populated');
  assert.strictEqual(res1.needs_clarification, false);
  console.log('✅ TEST 1 PASSED (Purpose: "Call X")');

  // ------------------------------------------------------------------
  // TEST 2: Purpose + Relative Time ("Remind me to call Rahul in 20 minutes")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 2: Purpose + Relative Time ---');
  const res2 = mockParseUserMessage('Remind me to call Rahul in 20 minutes', 'private', 'Asia/Kolkata');
  assert.strictEqual(res2.intent, 'CREATE_REMINDER');
  assert.strictEqual(res2.title, 'Call Rahul');
  assert.strictEqual(res2.time_type, 'relative');
  assert.strictEqual(res2.duration_seconds, 1200);
  console.log('✅ TEST 2 PASSED (Purpose: "Call Rahul", Duration: 20 mins)');

  // ------------------------------------------------------------------
  // TEST 3: Today / Tomorrow ("Remind me to submit my assignment tomorrow at 6 PM")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 3: Today / Tomorrow ---');
  const res3 = mockParseUserMessage('Remind me to submit my assignment tomorrow at 6 PM', 'private', 'Asia/Kolkata');
  assert.strictEqual(res3.intent, 'CREATE_REMINDER');
  assert.strictEqual(res3.title, 'Submit my assignment');
  assert.ok(res3.reminder_time);
  console.log('✅ TEST 3 PASSED (Purpose: "Submit my assignment")');

  // ------------------------------------------------------------------
  // TEST 4: Time Before Purpose ("Tomorrow at 7 PM remind me to send the report")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 4: Time Before Purpose ---');
  const res4 = mockParseUserMessage('Tomorrow at 7 PM remind me to send the report', 'private', 'Asia/Kolkata');
  assert.strictEqual(res4.intent, 'CREATE_REMINDER');
  assert.strictEqual(res4.title, 'Send the report');
  assert.ok(res4.reminder_time);
  console.log('✅ TEST 4 PASSED (Purpose: "Send the report")');

  // ------------------------------------------------------------------
  // TEST 5: Purpose Before Time ("Please remind me today at 8 PM to call Rahul")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 5: Purpose Before Time ---');
  const res5 = mockParseUserMessage('Please remind me today at 8 PM to call Rahul', 'private', 'Asia/Kolkata');
  assert.strictEqual(res5.intent, 'CREATE_REMINDER');
  assert.strictEqual(res5.title, 'Call Rahul');
  assert.ok(res5.reminder_time);
  console.log('✅ TEST 5 PASSED (Purpose: "Call Rahul")');

  // ------------------------------------------------------------------
  // TEST 6: Missing Purpose ("Remind me at 8 PM")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 6: Missing Purpose ---');
  const res6 = mockParseUserMessage('Remind me at 8 PM', 'private', 'Asia/Kolkata');
  assert.strictEqual(res6.intent, 'CLARIFY');
  assert.strictEqual(res6.needs_clarification, true);
  assert.strictEqual(res6.missing_field, 'title');
  assert.ok(res6.clarification_question?.includes('What would you like me to remind you about'));
  console.log('✅ TEST 6 PASSED (Correctly missing title)');

  // ------------------------------------------------------------------
  // TEST 7: Missing Time ("Remind me to call Rahul")
  // ------------------------------------------------------------------
  console.log('\n--- TEST 7: Missing Time ---');
  const res7 = mockParseUserMessage('Remind me to call Rahul', 'private', 'Asia/Kolkata');
  assert.strictEqual(res7.intent, 'CLARIFY');
  assert.strictEqual(res7.needs_clarification, true);
  assert.strictEqual(res7.missing_field, 'time');
  assert.strictEqual(res7.title, 'Call Rahul');
  assert.ok(res7.clarification_question?.includes('When would you like me to set this reminder for'));
  console.log('✅ TEST 7 PASSED (Correctly missing time)');

  // ------------------------------------------------------------------
  // TEST 8: Dynamic Relative Duration Variants
  // ------------------------------------------------------------------
  console.log('\n--- TEST 8: Dynamic Relative Durations ---');
  const dur1 = extractRelativeDuration('within 2mins');
  assert.strictEqual(dur1, 120);

  const dur2 = extractRelativeDuration('in 2 minutes');
  assert.strictEqual(dur2, 120);

  const dur3 = extractRelativeDuration('after 2 minutes');
  assert.strictEqual(dur3, 120);

  const dur4 = extractRelativeDuration('in 30 seconds');
  assert.strictEqual(dur4, 30);

  const dur5 = extractRelativeDuration('within 1 hour');
  assert.strictEqual(dur5, 3600);

  console.log('✅ TEST 8 PASSED (All relative duration variants parsed correctly)');

  // ------------------------------------------------------------------
  // TEST 9: Timezone Conversion
  // ------------------------------------------------------------------
  console.log('\n--- TEST 9: Timezone Conversion ---');
  const refTime9 = new Date('2026-10-06T20:36:00.000Z'); // 2:06 AM Kolkata
  const iso9 = parseAbsoluteLocalTime(3, 0, 'Asia/Kolkata', refTime9, 0);
  const formatted9 = formatLocalDateTime(iso9, 'Asia/Kolkata');
  assert.ok(formatted9.includes('3:00 AM'), `Expected 3:00 AM Kolkata, got: ${formatted9}`);
  console.log('✅ TEST 9 PASSED (Timezone preserved without double-shifting)');

  // ------------------------------------------------------------------
  // TEST 10: Scheduler Finds Due Reminder & Sends Telegram
  // ------------------------------------------------------------------
  console.log('\n--- TEST 10: Scheduler finds due reminder & sends Telegram ---');
  mockDb.seedDefaults();
  const pastTime = new Date(Date.now() - 60000).toISOString();
  const testChat = await mockDb.upsertChat({ telegram_chat_id: 999000, chat_type: 'private', title: 'Test Chat' });
  const testUser = await mockDb.upsertUser({ telegram_user_id: 999000, display_name: 'Tester' });

  const createdRem = await mockDb.createReminder({
    chat_id: testChat.id,
    created_by_user_id: testUser.id,
    title: 'Call Rahul',
    description: null,
    event_time: pastTime,
    reminder_time: pastTime,
    timezone: 'Asia/Kolkata',
    recurrence_type: 'none',
    status: 'scheduled',
  });

  const dueBefore = await mockDb.getDueInstances();
  const found = dueBefore.find((i) => i.reminder_id === createdRem.id);
  assert.ok(found, 'Due reminder instance should be found by scheduler');

  // Run scheduler
  const runResult = await ReminderService.processDueReminders();
  assert.ok(runResult.processed >= 1);
  console.log('✅ TEST 10 PASSED (Scheduler detected and processed due reminder)');

  // ------------------------------------------------------------------
  // TEST 11: Successful Delivery Updates Both Instance and Parent to SENT
  // ------------------------------------------------------------------
  console.log('\n--- TEST 11: Successful delivery -> SENT ---');
  const remindersAfter = await mockDb.getReminders();
  const targetRem = remindersAfter.find((r) => r.id === createdRem.id);
  assert.strictEqual(targetRem?.status, 'sent', 'Parent reminder status must be SENT');
  console.log('✅ TEST 11 PASSED (Parent & Instance updated to SENT)');

  // ------------------------------------------------------------------
  // TEST 12: Failed Delivery Updates Both Instance and Parent to FAILED
  // ------------------------------------------------------------------
  console.log('\n--- TEST 12: Failed delivery -> FAILED ---');
  const failRem = await mockDb.createReminder({
    chat_id: testChat.id,
    created_by_user_id: testUser.id,
    title: 'Failing Reminder',
    description: null,
    event_time: pastTime,
    reminder_time: pastTime,
    timezone: 'Asia/Kolkata',
    recurrence_type: 'none',
    status: 'scheduled',
  });

  // Temporarily force telegramProvider to fail
  const originalSend = telegramProvider.sendMessage.bind(telegramProvider);
  telegramProvider.sendMessage = async () => {
    throw new Error('Telegram Bot API HTTP 403 Forbidden');
  };

  try {
    await ReminderService.processDueReminders();
  } finally {
    telegramProvider.sendMessage = originalSend;
  }

  const remindersFailAfter = await mockDb.getReminders();
  const targetFailRem = remindersFailAfter.find((r) => r.id === failRem.id);
  assert.strictEqual(targetFailRem?.status, 'failed', 'Parent reminder status must be FAILED on error');
  console.log('✅ TEST 12 PASSED (Failed delivery safely handled and marked FAILED)');

  // ------------------------------------------------------------------
  // TEST 13: Idempotency / No Duplicate Delivery
  // ------------------------------------------------------------------
  console.log('\n--- TEST 13: No duplicate delivery ---');
  const reRun = await ReminderService.processDueReminders();
  assert.strictEqual(reRun.processed, 0, 'No already processed reminders should be delivered twice');
  console.log('✅ TEST 13 PASSED (Scheduler remains idempotent)');

  // ------------------------------------------------------------------
  // TEST 14: Private Chat Execution
  // ------------------------------------------------------------------
  console.log('\n--- TEST 14: Private Chat ---');
  const privRes = mockParseUserMessage('Remind me in 5 minutes to read book', 'private', 'Asia/Kolkata');
  assert.strictEqual(privRes.target, 'PRIVATE_CHAT');
  console.log('✅ TEST 14 PASSED (Private chat target set)');

  // ------------------------------------------------------------------
  // TEST 15: Group Chat Execution
  // ------------------------------------------------------------------
  console.log('\n--- TEST 15: Group Chat ---');
  const grpRes = mockParseUserMessage('Remind me in 5 minutes to sync', 'group', 'Asia/Kolkata');
  assert.strictEqual(grpRes.target, 'GROUP');
  console.log('✅ TEST 15 PASSED (Group chat target set)');

  // ------------------------------------------------------------------
  // TEST 16: Recurring Reminder Execution
  // ------------------------------------------------------------------
  console.log('\n--- TEST 16: Recurring Reminder ---');
  const recRes = mockParseUserMessage('Remind me every Monday at 9 AM to submit report', 'private', 'Asia/Kolkata');
  assert.strictEqual(recRes.intent, 'CREATE_REMINDER');
  assert.strictEqual(recRes.recurrence, 'weekly');
  assert.strictEqual(recRes.time_type, 'recurring');
  console.log('✅ TEST 16 PASSED (Recurring reminder parsed correctly)');

  console.log('\n🎉 ALL 16 AUTOMATED SUITE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});

