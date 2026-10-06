import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIExtractedPayload } from '@/types';
import { validateAIOutput } from '@/lib/validation/aiOutputSchema';
import { mockParseUserMessage } from './mockAi';
import { getCurrentISOString } from '@/lib/utils/dateUtils';

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
  "intent": "CREATE_REMINDER" | "UPDATE_REMINDER" | "CANCEL_REMINDER" | "LIST_REMINDERS" | "CLARIFY" | "OUT_OF_SCOPE" | "ACKNOWLEDGEMENT" | "COMMAND",
  "title": string | null,
  "event_time": string (ISO 8601 timestamp with offset e.g. 2026-10-10T18:00:00+05:30) | null,
  "reminder_time": string (ISO 8601 timestamp with offset) | null,
  "timezone": "${timezone}",
  "recurrence": "none" | "daily" | "weekly" | "monthly" | "custom" | null,
  "target": "${chatType === 'private' ? 'PRIVATE_CHAT' : 'GROUP'}",
  "needs_clarification": boolean,
  "clarification_question": string | null,
  "search_query": string | null,
  "missing_field": "title" | "time" | "event_time" | "selection" | null
}

CRITICAL CONVERSATIONAL RULES:
1. SLASH COMMANDS: If message starts with '/start' or '/help', set intent="COMMAND", title="/start". If '/cancel', set intent="CANCEL_REMINDER", title="cancel_active_context".
2. ACKNOWLEDGEMENTS: If message is a conversational thank you/thanks/ok/okay/done/great/perfect, set intent="ACKNOWLEDGEMENT". NEVER create a reminder or ask a clarification question for acknowledgements.
3. RELATIVE DURATION: For relative duration phrases like "in 2 minutes", "within 2mins", "after 2 minutes", "in 30 seconds", "within 1 hour", "in 3 hours", calculate reminder_time strictly as Current Reference Time + specified duration. NEVER interpret relative duration numbers as absolute clock time (e.g., "2 minutes" must NOT be 2:00 AM).
4. ABSOLUTE CLOCK TIME: "at 2 AM" means clock time 2:00 AM. "tomorrow at 2 AM" means tomorrow 2:00 AM.
5. CLARIFICATION: NEVER guess missing date/time for incomplete requests. Set intent="CLARIFY" only when there is genuinely missing scheduling info for a reminder request.
6. Do NOT include markdown formatting or commentary. Return ONLY valid JSON.
`;

    const result = await model.generateContent([
      systemPrompt,
      `User message: "${userText}"`,
    ]);

    const responseText = result.response.text();
    const validation = validateAIOutput(responseText);

    if (validation.success && validation.data) {
      return validation.data as AIExtractedPayload;
    }

    console.warn('Gemini response validation failed, falling back to mock parser:', validation.error);
    return mockParseUserMessage(userText, chatType, timezone, pendingContext);
  } catch (error) {
    console.error('Gemini API call failed, falling back to mock parser:', error);
    return mockParseUserMessage(userText, chatType, timezone, pendingContext);
  }
}
