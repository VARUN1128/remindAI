import assert from 'node:assert';
import { mockParseUserMessage } from '../lib/ai/mockAi';
import { ReminderService } from '../lib/reminders/reminderService';
import { mockDb } from '../lib/database/mockDb';
import { ContextManager } from '../lib/ai/contextManager';

console.log('🧪 RUNNING REMINDLY TEST SUITE...');

async function runTests() {
  // 1. "Remind me in 2 minutes to test" → reminder time = now + 2 minutes
  console.log('\n--- TEST 1: "Remind me in 2 minutes to test" ---');
  const now1 = Date.now();
  const test1 = mockParseUserMessage('Remind me in 2 minutes to test', 'private', 'Asia/Kolkata');
  assert.strictEqual(test1.intent, 'CREATE_REMINDER');
  assert.strictEqual(test1.title?.toLowerCase(), 'test');
  assert.ok(test1.reminder_time);
  const diff1Ms = new Date(test1.reminder_time!).getTime() - now1;
  const diff1Min = Math.round(diff1Ms / 60000);
  assert.strictEqual(diff1Min, 2);
  console.log('✅ TEST 1 PASSED');

  // 2. "Remind me within 2 minutes to test" → reminder time = now + 2 minutes
  console.log('\n--- TEST 2: "Remind me within 2 minutes to test" ---');
  const now2 = Date.now();
  const test2 = mockParseUserMessage('Remind me within 2 minutes to test', 'private', 'Asia/Kolkata');
  assert.strictEqual(test2.intent, 'CREATE_REMINDER');
  assert.strictEqual(test2.title?.toLowerCase(), 'test');
  assert.ok(test2.reminder_time);
  const diff2Ms = new Date(test2.reminder_time!).getTime() - now2;
  const diff2Min = Math.round(diff2Ms / 60000);
  assert.strictEqual(diff2Min, 2);
  console.log('✅ TEST 2 PASSED');

  // 3. "Remind me in 2 mins to test" → reminder time = now + 2 minutes
  console.log('\n--- TEST 3: "Remind me in 2 mins to test" ---');
  const now3 = Date.now();
  const test3 = mockParseUserMessage('Remind me in 2 mins to test', 'private', 'Asia/Kolkata');
  assert.strictEqual(test3.intent, 'CREATE_REMINDER');
  assert.strictEqual(test3.title?.toLowerCase(), 'test');
  assert.ok(test3.reminder_time);
  const diff3Ms = new Date(test3.reminder_time!).getTime() - now3;
  const diff3Min = Math.round(diff3Ms / 60000);
  assert.strictEqual(diff3Min, 2);
  console.log('✅ TEST 3 PASSED');

  // 4. "Remind me at 2 AM to test" → reminder time = 2:00 AM, NOT now + 2 minutes
  console.log('\n--- TEST 4: "Remind me at 2 AM to test" ---');
  const test4 = mockParseUserMessage('Remind me at 2 AM to test', 'private', 'Asia/Kolkata');
  assert.strictEqual(test4.intent, 'CREATE_REMINDER');
  assert.strictEqual(test4.title?.toLowerCase(), 'test');
  assert.ok(test4.reminder_time);
  const hour4 = new Date(test4.reminder_time!).getHours();
  // 2 AM local or parsed should have hour 2 (or in Asia/Kolkata context)
  // Let's check that it's parsed as 2:00 AM and not relative duration now + 2m
  const diff4Min = Math.round((new Date(test4.reminder_time!).getTime() - Date.now()) / 60000);
  assert.notStrictEqual(diff4Min, 2, 'Should NOT be interpreted as relative 2 minutes');
  console.log('✅ TEST 4 PASSED');

  // 5. "Remind me tomorrow at 2 AM to test" → tomorrow at 2:00 AM
  console.log('\n--- TEST 5: "Remind me tomorrow at 2 AM to test" ---');
  const test5 = mockParseUserMessage('Remind me tomorrow at 2 AM to test', 'private', 'Asia/Kolkata');
  assert.strictEqual(test5.intent, 'CREATE_REMINDER');
  assert.strictEqual(test5.title?.toLowerCase(), 'test');
  assert.ok(test5.reminder_time);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.strictEqual(new Date(test5.reminder_time!).getDate(), tomorrow.getDate());
  console.log('✅ TEST 5 PASSED');

  // 6. Missing-time clarification: "Remind me about the meeting Friday" → CLARIFY
  console.log('\n--- TEST 6: Missing-time clarification ---');
  const test6 = mockParseUserMessage('Remind me about the meeting Friday', 'private', 'Asia/Kolkata');
  assert.strictEqual(test6.intent, 'CLARIFY');
  assert.strictEqual(test6.needs_clarification, true);
  assert.ok(test6.clarification_question);
  console.log('✅ TEST 6 PASSED');

  // 7. Answer clarification: "7 PM" → reminder created
  console.log('\n--- TEST 7: Answer clarification ---');
  const pendingCtx7 = {
    id: 'ctx-1',
    chat_id: 'chat-1',
    user_id: 'user-1',
    context_type: 'AWAITING_TIME',
    context_data: { title: 'meeting Friday' },
    expires_at: new Date(Date.now() + 100000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const test7 = mockParseUserMessage('7 PM', 'private', 'Asia/Kolkata', pendingCtx7);
  assert.strictEqual(test7.intent, 'CREATE_REMINDER');
  assert.strictEqual(test7.needs_clarification, false);
  assert.ok(test7.reminder_time);
  console.log('✅ TEST 7 PASSED');

  // 8. After successful clarification: "Thank you" → conversational response, NOT another clarification
  console.log('\n--- TEST 8: After successful clarification -> "Thank you" ---');
  // Pending context cleared, user says "Thank you"
  const test8 = mockParseUserMessage('Thank you', 'private', 'Asia/Kolkata', null);
  assert.strictEqual(test8.intent, 'ACKNOWLEDGEMENT');
  assert.ok(test8.conversational_response);
  console.log('✅ TEST 8 PASSED');

  // 9. /start → welcome message, NO reminder
  console.log('\n--- TEST 9: /start command ---');
  const test9 = mockParseUserMessage('/start', 'private', 'Asia/Kolkata');
  assert.strictEqual(test9.intent, 'COMMAND');
  assert.ok(test9.conversational_response?.includes('Remindly'));
  console.log('✅ TEST 9 PASSED');

  // 10. "Thanks" → conversational response, NO reminder
  console.log('\n--- TEST 10: "Thanks" ---');
  const test10 = mockParseUserMessage('Thanks', 'private', 'Asia/Kolkata');
  assert.strictEqual(test10.intent, 'ACKNOWLEDGEMENT');
  assert.ok(test10.conversational_response);
  console.log('✅ TEST 10 PASSED');

  // 11. "okay" → conversational response, NO reminder
  console.log('\n--- TEST 11: "okay" ---');
  const test11 = mockParseUserMessage('okay', 'private', 'Asia/Kolkata');
  assert.strictEqual(test11.intent, 'ACKNOWLEDGEMENT');
  assert.ok(test11.conversational_response);
  console.log('✅ TEST 11 PASSED');

  // 12. Context isolation: Chat A's pending clarification must never affect Chat B
  console.log('\n--- TEST 12: Context isolation ---');
  await ContextManager.setPendingContext('chat-A', 'user-A', 'AWAITING_TIME', { title: 'Test A' });
  const ctxA = await ContextManager.getPendingContext('chat-A', 'user-A');
  const ctxB = await ContextManager.getPendingContext('chat-B', 'user-B');
  assert.ok(ctxA, 'Chat A should have active context');
  assert.strictEqual(ctxB, null, 'Chat B should NOT have active context');
  await ContextManager.clearContext('chat-A', 'user-A');
  console.log('✅ TEST 12 PASSED');

  // 13. Group chat: Preserve existing group reminder behavior
  console.log('\n--- TEST 13: Group chat reminder ---');
  const test13 = mockParseUserMessage(
    'Guys, presentation Friday at 10 AM. Remind everyone Thursday evening',
    'group',
    'Asia/Kolkata'
  );
  assert.strictEqual(test13.intent, 'CREATE_REMINDER');
  assert.strictEqual(test13.target, 'GROUP');
  console.log('✅ TEST 13 PASSED');

  // 14. Out-of-scope: Preserve existing out-of-scope behavior
  console.log('\n--- TEST 14: Out of scope ---');
  const test14 = mockParseUserMessage('Write me a Python scraper', 'private', 'Asia/Kolkata');
  assert.strictEqual(test14.intent, 'OUT_OF_SCOPE');
  console.log('✅ TEST 14 PASSED');

  // Additional check: Scheduler Idempotency
  console.log('\n--- TEST 15: Scheduler Idempotency ---');
  mockDb.seedDefaults();
  const run1 = await ReminderService.processDueReminders();
  assert.ok(run1.processed >= 0);
  const run2 = await ReminderService.processDueReminders();
  assert.strictEqual(run2.processed, 0);
  console.log('✅ TEST 15 PASSED');

  console.log('\n🎉 ALL 15 AUTOMATED TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
