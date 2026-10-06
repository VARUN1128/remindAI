# REMINDLY 🤖🔔

> **"An AI agent that turns conversations into commitments and reminders."**

Remindly is an AI-powered Telegram reminder and group coordination agent. Users talk to Remindly in natural language without learning rigid bot commands. Remindly extracts intents, handles relative timing ("2 hours before meeting"), manages recurring commitments ("every Monday at 9 AM"), asks clarification questions when information is missing, coordinates group deadlines, and delivers timely notifications.

---

## 🌟 Features

- 💬 **Zero Command Learning**: Speak naturally.
- 🎯 **AI Natural Language Parsing**: Uses Gemini AI with strict JSON output schemas.
- ❓ **Smart Clarification System**: Asks follow-up questions when dates/times are missing.
- 👥 **Telegram Group Coordination**: Remind individuals in private chats or entire teams in group chats.
- ⏰ **Relative & Recurring Scheduling**: Supports "in 3 hours", "2 hours before meeting", and "every Monday at 9 AM".
- 🔒 **Idempotent Scheduler**: Cron engine with atomic database claims prevents duplicate notifications.
- 📊 **Admin Dashboard**: Live metrics, reminder filterable database, connected chat logs, and delivery audits.
- 🎮 **Interactive Demo Simulator**: Built-in interactive Telegram simulator lets you test the agent right from the web dashboard even in mock mode.

---

## 🏗 System Architecture & Technologies

- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS, Lucide Icons)
- **Backend**: Next.js Server-Side API Routes (`/api/telegram/webhook`, `/api/cron/reminders`, `/api/health`, `/api/demo/*`)
- **Database**: Supabase PostgreSQL (SQL Schema with tables, indexes, triggers, and RLS) + Mock DB fallback
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) + Mock AI fallback
- **Messaging**: Telegram Bot API (`MessagingProvider` extensible architecture for WhatsApp/Slack)
- **Scheduler**: Vercel Cron compatible endpoint (`GET /api/cron/reminders`)

---

## 📁 Repository Folder Structure

```text
remindAI/
├── app/
│   ├── api/
│   │   ├── telegram/
│   │   │   └── webhook/route.ts      # Main Telegram update handler
│   │   ├── cron/
│   │   │   └── reminders/route.ts    # Scheduler cron processor
│   │   ├── health/route.ts           # System health & credentials inspector
│   │   └── demo/
│   │       ├── trigger-reminder/route.ts
│   │       └── simulate-webhook/route.ts
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard overview with metrics & audit logs
│   │   ├── reminders/page.tsx        # Filterable reminders table
│   │   ├── chats/page.tsx            # Connected Telegram chats list
│   │   └── users/page.tsx            # Telegram users directory
│   ├── settings/page.tsx             # Configuration & environment setup
│   ├── layout.tsx                    # Root layout with dark mode & SEO metadata
│   ├── page.tsx                      # SaaS landing page with live interactive simulator
│   └── globals.css                   # Tailwind styles & glassmorphism utilities
├── components/
│   └── demo/
│       └── TelegramSimulator.tsx     # Live interactive Telegram chat simulator
├── lib/
│   ├── ai/
│   │   ├── aiService.ts              # Gemini API service & fallback logic
│   │   ├── mockAi.ts                 # Deterministic natural language parser
│   │   └── contextManager.ts         # Multi-turn clarification conversation state
│   ├── database/
│   │   ├── repository.ts             # Unified repository layer
│   │   ├── mockDb.ts                 # In-memory mock database store
│   │   └── supabaseClient.ts         # Supabase client wrapper
│   ├── messaging/
│   │   └── messagingProvider.ts      # Extensible messaging abstraction layer
│   ├── telegram/
│   │   └── telegramProvider.ts       # Telegram API provider implementation
│   ├── reminders/
│   │   └── reminderService.ts        # Business logic: Create, update, cancel, list, scheduler
│   ├── validation/
│   │   └── aiOutputSchema.ts         # Zod schemas for AI JSON validation
│   └── utils/
│       └── dateUtils.ts              # Timezone-aware date helper functions
├── types/
│   └── index.ts                      # TypeScript interface definitions
├── supabase/
│   └── schema.sql                    # Production PostgreSQL schema
├── tests/
│   └── remindly.test.ts              # Unit and integration test suite
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment file (DEMO_MODE=true)
├── package.json
└── README.md
```

---

## 🚀 Beginner's Quick Start Guide

### Step 1: Install Node.js Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

### Step 2: Run Locally in Demo Mode (No API keys needed initially!)

Remindly is built to run out-of-the-box in **Demo Mode**. You can start the dev server right away without providing any real API credentials:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. You will see:
1. **Landing Page** with a live, interactive Telegram Simulator widget.
2. **Admin Dashboard** (`http://localhost:3000/dashboard`) with sample metrics, active reminders, connected chats, and manual scheduler execution.

---

## 🔑 How to Configure Real Credentials

When you are ready to connect a real Telegram Bot, real Gemini AI key, and a real Supabase database, follow these steps:

### A. Obtain Telegram Bot Token
1. Open Telegram and search for `@BotFather`.
2. Send the command `/newbot`.
3. Follow the instructions to give your bot a name (e.g. `MyRemindlyBot`) and username (e.g. `MyRemindly_bot`).
4. `@BotFather` will give you an API Token (looks like `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
5. Copy this token for your `.env.local` file.

### B. Obtain Gemini AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** -> **"Create API key in new project"**.
4. Copy your API key string.

### C. Create Supabase Database
1. Go to [Supabase](https://supabase.com/) and create a free project.
2. In your Supabase Dashboard, go to **Project Settings -> API**.
3. Copy the **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`) and the **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`).
4. In Supabase Dashboard, open the **SQL Editor**, paste the contents of `supabase/schema.sql` from this repository, and click **Run**.

### D. Update `.env.local` File

Edit your `.env.local` file with your credentials and set `DEMO_MODE=false`:

```env
TELEGRAM_BOT_TOKEN=123456789:YOUR_ACTUAL_TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET=your_random_secret_string

GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SUPABASE_SERVICE_ROLE_KEY

CRON_SECRET=your_cron_secret_key

DEFAULT_TIMEZONE=Asia/Kolkata
DEMO_MODE=false
```

---

## 🌐 Connecting Telegram Webhook

Once deployed to Vercel (or using a tunneling tool like `ngrok` during local development):

```bash
# Example using curl to register Webhook with Telegram
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-deployment-domain.vercel.app/api/telegram/webhook"}'
```

To check webhook status:
```bash
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

---

## 👥 Adding the Bot to a Telegram Group

1. Open your Telegram Group chat.
2. Click group settings -> **Add Members**.
3. Search for your bot username (e.g. `@MyRemindly_bot`) and add it.
4. *(Recommended)* Promote the bot to an **Administrator** so it receives all group messages without needing explicit `@mentions`.
5. Group members can now type:
   > "Guys, presentation Friday at 10 AM. Remind everyone Thursday at 7 PM."

---

## 🧪 Testing Product Features

Run automated test suite:
```bash
npm test
```

### Manual Product Test Checklist:

| Test | Input Message | Expected Outcome |
|---|---|---|
| **Test 1 — Normal** | *"Remind me tomorrow at 6 PM to submit my assignment"* | Creates reminder for tomorrow 6 PM |
| **Test 2 — Relative** | *"Meeting Friday at 4 PM. Remind me 2 hours before"* | Creates event for Friday 4 PM and reminder for Friday 2 PM |
| **Test 3 — Recurring** | *"Remind me every Monday at 9 AM to submit weekly report"* | Creates weekly recurring reminder |
| **Test 4 — Clarification** | *"Remind me about the meeting Friday evening"* | Bot asks: *"What time is the meeting on Friday evening?"* |
| **Test 5 — Out of Scope** | *"Write me a Python scraper"* | Bot politely refuses non-reminder requests |

---

## 🚀 Deploying to Vercel

1. Push code to GitHub.
2. Import repository in [Vercel](https://vercel.com/).
3. Add Environment Variables in Vercel project settings (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `DEFAULT_TIMEZONE`, `DEMO_MODE=false`).
4. Click **Deploy**.
5. Add Vercel Cron trigger in `vercel.json` pointing to `/api/cron/reminders`.

---

## ❓ Troubleshooting & Common Issues

- **Bot not responding in Telegram group**:
  - *Fix*: Ensure Privacy Mode is disabled in `@BotFather` (`/setprivacy` -> `Disable`) or promote bot to group Administrator.
- **AI returns error**:
  - *Fix*: Check `GEMINI_API_KEY` validity in Google AI Studio or set `DEMO_MODE=true` to test using built-in Mock AI.
- **Database queries failing**:
  - *Fix*: Verify you ran `supabase/schema.sql` in Supabase SQL editor.
