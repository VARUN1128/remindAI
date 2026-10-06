import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIExtractedPayload } from '@/types';
import { validateAIOutput } from '@/lib/validation/aiOutputSchema';
import { mockParseUserMessage } from './mockAi';
import { getCurrentISOString, calculateRelativeInstant } from '@/lib/utils/dateUtils';

const apiKey = process.env.GEMINI_API_KEY || '';
const isGeminiConfigured = Boolean(
  apiKey && !apiKey.includes('placeholder') && !apiKey.includes('your_')
);

const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey) : null;

export async function parseUserMessage(params: {
  userText: string;
  chatType: 'private' | 'group' | 'supergroup';
  timezone?: string;
  pendingContext?: any;
}): Promise<AIExtractedPayload> {
  const { userText, chatType, timezone = 'Asia/Kolkata', pendingContext } = params;

  // Use Mock AI if in DEMO_MODE or Gemini API key is missing
  if (process.env.DEMO_MODE === 'true' || !isGeminiConfigured || !genAI) {
    return mockParseUserMessage(userText, chatType, timezone, pendingContext);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const currentIso = getCurrentISOString(timezone);

    const systemPrompt = `
You are Remindly's AI Commitment & Scheduling Engine.
Your single job is to convert natural-language messages into structured reminder actions.

Current Reference Time (ISO 8601): ${currentIso}
User Timezone: ${timezone}
Chat Type: ${chatType}
Pending Context: ${pendingContext ? JSON.stringify(pendingContext) : 'None'}

Return ONLY a single valid JSON object matching this exact schema:
{
  "intent": "CREATE_REMINDER" | "UPDATE_REMINDER" | "CANCEL_REMINDER" | "LIST_REMINDERS" | "CLARIFY" | "OUT_OF_SCOPE" | "GREETING" | "ACKNOWLEDGEMENT" | "COMMAND",
  "title": string | null,
  "event_time": string (ISO 8601 timestamp with offset e.g. 2026-10-10T18:00:00+05:30) | null,
  "reminder_time": string (ISO 8601 timestamp with offset) | null,
  "timezone": "${timezone}",
  "time_type": "absolute" | "relative" | "recurring" | null,
  "duration_seconds": number | null,
  "recurrence": "none" | "daily" | "weekly" | "monthly" | "custom" | null,
  "target": "${chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP'}",
  "needs_clarification": boolean,
  "clarification_question": string | null,
  "conversational_response": string | null,
  "search_query": string | null,
  "missing_field": "title" | "time" | "event_time" | "selection" | null
}

CRITICAL CONVERSATIONAL RULES:
1. GREETINGS: If message is a greeting like "hi", "hello", "hey", "good morning", set intent="GREETING", conversational_response="Hi! 👋 What would you like me to remind you about?". NEVER create a reminder or clarification for greetings.
2. SLASH COMMANDS: If message starts with '/start' or '/help', set intent="COMMAND", title="/start". If '/cancel', set intent="CANCEL_REMINDER", title="cancel_active_context".
3. ACKNOWLEDGEMENTS: If message is a conversational thank you/thanks/ok/okay/done/great/perfect, set intent="ACKNOWLEDGEMENT", conversational_response="You're welcome! 😊". NEVER create a reminder or clarification for acknowledgements.
4. RELATIVE DURATION: For relative duration phrases like "in 2 minutes", "within 2mins", "after 2 minutes", "in 30 seconds", "within 1 hour", set time_type="relative" and duration_seconds=<number of seconds>. Do NOT invent absolute clock time for relative durations.
5. ABSOLUTE CLOCK TIME: "at 3 AM" means 3:00 AM local time in user's configured timezone. Set time_type="absolute".
6. CLARIFICATION: NEVER guess missing date/time for incomplete requests. Set intent="CLARIFY" only when there is genuinely missing scheduling info for a reminder request.
7. Do NOT include markdown formatting or commentary. Return ONLY valid JSON.
`;

    const result = await model.generateContent([
      systemPrompt,
      `User message: "${userText}"`,
    ]);

    const responseText = result.response.text();
    const validation = validateAIOutput(responseText);

    if (validation.success && validation.data) {
      const payload = validation.data as AIExtractedPayload;
      if (payload.time_type === 'relative' && typeof payload.duration_seconds === 'number') {
        payload.reminder_time = calculateRelativeInstant(payload.duration_seconds, new Date(), timezone);
      }
      return payload;
    }

    console.warn('Gemini response validation failed, falling back to mock parser:', validation.error);
    return mockParseUserMessage(userText, chatType, timezone, pendingContext);
  } catch (error) {
    console.error('Gemini API call failed, falling back to mock parser:', error);
    return mockParseUserMessage(userText, chatType, timezone, pendingContext);
  }
}
