import { z } from 'zod';

export const AIIntentSchema = z.enum([
  'CREATE_REMINDER',
  'UPDATE_REMINDER',
  'CANCEL_REMINDER',
  'LIST_REMINDERS',
  'CLARIFY',
  'OUT_OF_SCOPE',
  'ACKNOWLEDGEMENT',
  'COMMAND',
]);

export const TargetAudienceSchema = z.enum(['PRIVATE_CHAT', 'GROUP']).nullable().optional();

export const RecurrenceTypeSchema = z
  .enum(['none', 'daily', 'weekly', 'monthly', 'custom'])
  .nullable()
  .optional();

export const AIExtractedPayloadSchema = z.object({
  intent: AIIntentSchema,
  title: z.string().nullable().optional(),
  event_time: z.string().nullable().optional(),
  reminder_time: z.string().nullable().optional(),
  timezone: z.string().default('Asia/Kolkata'),
  recurrence: RecurrenceTypeSchema,
  target: TargetAudienceSchema,
  needs_clarification: z.boolean().default(false),
  clarification_question: z.string().nullable().optional(),
  conversational_response: z.string().nullable().optional(),
  search_query: z.string().nullable().optional(),
  missing_field: z.enum(['title', 'time', 'event_time', 'selection']).nullable().optional(),
  raw_reasoning: z.string().optional(),
});

export type ValidatedAIPayload = z.infer<typeof AIExtractedPayloadSchema>;

/**
 * Validates raw AI JSON output string or object against strict schema
 */
export function validateAIOutput(rawOutput: unknown): {
  success: boolean;
  data?: ValidatedAIPayload;
  error?: string;
} {
  try {
    let jsonObject = rawOutput;
    if (typeof rawOutput === 'string') {
      // Remove any markdown code fence formatting like ```json ... ```
      const cleaned = rawOutput.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      jsonObject = JSON.parse(cleaned);
    }

    const result = AIExtractedPayloadSchema.safeParse(jsonObject);
    if (!result.success) {
      return {
        success: false,
        error: `AI output validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to parse AI JSON response: ${err.message}`,
    };
  }
}
