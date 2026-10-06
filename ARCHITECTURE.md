# ARCHITECTURE.md — Remindly Technical System Architecture

## 1. System Overview

Remindly is designed as a modular, event-driven AI agent architecture that processes natural-language text from messaging platforms (Telegram), extracts intent & time commitments into validated structured JSON, persists state in PostgreSQL (Supabase), and triggers timely notifications via an idempotent cron scheduler engine.

```mermaid
flowchart TD
    User([Telegram User / Group]) -->|HTTP POST Webhook| Webhook[app/api/telegram/webhook]
    Webhook --> Repo[lib/database/repository.ts]
    Repo --> Context[lib/ai/contextManager.ts]
    Context --> AIService[lib/ai/aiService.ts]
    AIService -->|Structured Prompt| Gemini[Google Gemini API / Mock AI]
    Gemini -->|JSON Payload| ZodVal[lib/validation/aiOutputSchema.ts]
    ZodVal --> RemEngine[lib/reminders/reminderService.ts]
    RemEngine --> DB[(Supabase Postgres / Mock DB)]
    
    CronJob[GET /api/cron/reminders] -->|Periodic Trigger| RemEngine
    RemEngine -->|Atomic Claim & Deliver| Provider[lib/messaging/messagingProvider.ts]
    Provider -->|Telegram Bot API| User
```

---

## 2. AI Execution Pipeline & Clarification State Machine

The AI pipeline is strictly decoupled from database mutation operations. Free-form model output is never executed directly.

1. **Ingestion**: Message received at `/api/telegram/webhook`.
2. **Context Lookup**: Checks `conversation_context` table for active pending clarifications (e.g. `AWAITING_TIME`).
3. **Structured Prompt Construction**: Includes current server timestamp in target timezone (`Asia/Kolkata`) and JSON schema instructions.
4. **Parsing**: Gemini API returns candidate JSON.
5. **Schema Validation**: Zod (`aiOutputSchema.ts`) validates intent, dates, times, and recurrence rules.
6. **Clarification Intercept**: If required details (such as exact meeting time) are missing, intent is resolved to `CLARIFY`. A 15-minute clarification session is recorded in `conversation_context`, and a follow-up question is sent back to the user.

---

## 3. Database Entity Model

```mermaid
erDiagram
    USERS ||--o{ REMINDERS : "creates"
    CHATS ||--o{ REMINDERS : "contains"
    REMINDERS ||--o{ REMINDER_INSTANCES : "spawns"
    REMINDERS ||--o{ REMINDER_LOGS : "logs"
    CHATS ||--o{ CONVERSATION_CONTEXT : "has"
    USERS ||--o{ CONVERSATION_CONTEXT : "owns"

    USERS {
        uuid id PK
        bigint telegram_user_id UK
        string telegram_username
        string display_name
        string timezone
    }

    CHATS {
        uuid id PK
        bigint telegram_chat_id UK
        string chat_type
        string chat_title
        string timezone
    }

    REMINDERS {
        uuid id PK
        uuid chat_id FK
        uuid created_by_user_id FK
        string title
        timestamptz event_time
        timestamptz reminder_time
        string recurrence_type
        string status
    }

    REMINDER_INSTANCES {
        uuid id PK
        uuid reminder_id FK
        timestamptz scheduled_for
        string status
        timestamptz sent_at
    }

    CONVERSATION_CONTEXT {
        uuid id PK
        uuid chat_id FK
        uuid user_id FK
        string context_type
        jsonb context_data
        timestamptz expires_at
    }

    REMINDER_LOGS {
        uuid id PK
        uuid reminder_id FK
        bigint telegram_chat_id
        timestamptz sent_at
        string delivery_status
        string error_message
    }
```

---

## 4. Idempotent Scheduler Engine

To prevent duplicate notification delivery across concurrent cron executions:
1. `GET /api/cron/reminders` queries `reminder_instances` where `status = 'scheduled'` and `scheduled_for <= NOW()`.
2. For each instance, it executes an atomic claim query (`UPDATE reminder_instances SET status = 'claimed' WHERE id = :id AND status = 'scheduled'`).
3. If zero rows are updated, another runner has claimed the task.
4. If claimed successfully, the notification is sent via `MessagingProvider`.
5. Upon delivery success, status transitions to `'sent'`, and an entry is logged in `reminder_logs`.

---

## 5. Extensible Messaging Provider Pattern (WhatsApp / Slack / Discord Support)

The messaging layer is decoupled behind the `MessagingProvider` interface:

```typescript
export interface MessagingProvider {
  name: string;
  sendMessage(chatId: number | string, text: string): Promise<boolean>;
  sendNotification(
    chatId: number | string,
    title: string,
    timeText: string,
    isGroup: boolean,
    extraInfo?: string
  ): Promise<boolean>;
}
```

- **TelegramProvider**: Implemented for MVP.
- **Future Providers**: `WhatsAppProvider` (using WhatsApp Business API / Twilio), `SlackProvider`, `DiscordProvider` can be registered in `messagingRegistry` without touching reminder engine logic.

---

## 6. Group Permissions Model

- In **Private Chats**, the user owns all reminder lifecycle actions.
- In **Group Chats**, any member can create reminders targeted to the group.
- Destructive operations (`CANCEL_REMINDER`, `UPDATE_REMINDER`) on group reminders require either:
  1. Creator ownership (`created_by_user_id === user.id`), OR
  2. Group administrator privilege (`getChatMemberRole` returns `'administrator'` or `'creator'`).
