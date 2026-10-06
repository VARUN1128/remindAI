// ====================================================================
// REMINDLY - Core Type Definitions
// ====================================================================

export type ChatType = 'private' | 'group' | 'supergroup';

export type ReminderStatus = 'scheduled' | 'sent' | 'cancelled' | 'failed';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type InstanceStatus = 'scheduled' | 'claimed' | 'sent' | 'cancelled' | 'failed';

export type DeliveryStatus = 'success' | 'failed';

export type AIIntent =
  | 'CREATE_REMINDER'
  | 'UPDATE_REMINDER'
  | 'CANCEL_REMINDER'
  | 'LIST_REMINDERS'
  | 'CLARIFY'
  | 'OUT_OF_SCOPE'
  | 'GREETING'
  | 'ACKNOWLEDGEMENT'
  | 'COMMAND';

export type TimeType = 'absolute' | 'relative' | 'recurring';

export type TargetAudience = 'PRIVATE_CHAT' | 'GROUP';

// Database Models
export interface User {
  id: string;
  telegram_user_id: number;
  telegram_username?: string | null;
  display_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  telegram_chat_id: number;
  chat_type: ChatType;
  chat_title?: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  chat_id: string;
  created_by_user_id: string;
  title: string;
  description?: string | null;
  event_time?: string | null; // ISO Timestamp string
  reminder_time: string; // ISO Timestamp string
  timezone: string;
  recurrence_type: RecurrenceType;
  recurrence_rule?: Record<string, any> | null;
  status: ReminderStatus;
  created_at: string;
  updated_at: string;

  // Joined fields
  chat?: Chat;
  created_by?: User;
}

export interface ReminderInstance {
  id: string;
  reminder_id: string;
  scheduled_for: string; // ISO Timestamp string
  status: InstanceStatus;
  sent_at?: string | null;
  created_at: string;

  // Joined fields
  reminder?: Reminder;
}

export interface ConversationContext {
  id: string;
  chat_id: string;
  user_id: string;
  context_type: string; // e.g. 'AWAITING_TIME', 'AWAITING_TITLE', 'MULTIPLE_MATCHES_CHOICE'
  context_data: Record<string, any>;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReminderLog {
  id: string;
  reminder_id?: string | null;
  instance_id?: string | null;
  telegram_chat_id: number;
  sent_at: string;
  delivery_status: DeliveryStatus;
  error_message?: string | null;
  created_at: string;

  // Joined fields
  reminder?: Reminder;
}

// AI Agent Structured JSON Output Format
export interface AIExtractedPayload {
  intent: AIIntent;
  title?: string | null;
  event_time?: string | null; // ISO 8601 string or null
  reminder_time?: string | null; // ISO 8601 string or null
  timezone: string;
  time_type?: TimeType | null;
  duration_seconds?: number | null;
  recurrence?: RecurrenceType | null;
  target?: TargetAudience | null;
  needs_clarification: boolean;
  clarification_question?: string | null;
  conversational_response?: string | null;
  search_query?: string | null; // For UPDATE or CANCEL queries
  missing_field?: 'title' | 'time' | 'event_time' | 'selection' | null;
  raw_reasoning?: string;
}

// Telegram Update Schema
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: ChatType;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

// Extensible Messaging Provider Interface (for Telegram now, WhatsApp/Slack later)
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
  getChatMemberRole?(
    chatId: number | string,
    userId: number | string
  ): Promise<'creator' | 'administrator' | 'member' | 'left' | 'kicked'>;
}

// System Health Status
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'error';
  demoMode: boolean;
  databaseConnected: boolean;
  telegramConfigured: boolean;
  geminiConfigured: boolean;
  timestamp: string;
}

// Owner Analytics Data Structures
export interface OwnerAnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalReminders: number;
  scheduledReminders: number;
  sentReminders: number;
  failedReminders: number;
  cancelledReminders: number;
  groupChats: number;
  privateChats: number;
  privateReminders: number;
  groupReminders: number;
  deliverySuccessRate: number;
}

export interface UserGrowthPoint {
  date: string;
  count: number;
}

export interface ReminderActivityPoint {
  date: string;
  created: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export interface TopUserSummary {
  user: User;
  totalReminders: number;
  sentReminders: number;
  lastActive: string;
}

export interface TopGroupSummary {
  chat: Chat;
  totalReminders: number;
  sentReminders: number;
  lastActive: string;
}

export interface ActivityEvent {
  id: string;
  type: 'REMINDER_CREATED' | 'REMINDER_SENT' | 'REMINDER_FAILED' | 'REMINDER_CANCELLED' | 'NEW_USER' | 'NEW_GROUP';
  user_name?: string | null;
  chat_title?: string | null;
  reminder_title?: string | null;
  timestamp: string;
  status?: string | null;
  details?: string | null;
}

export interface IntentMetric {
  intent: AIIntent;
  count: number;
}

export interface SystemReliabilityMetrics {
  totalAttempted: number;
  totalSent: number;
  totalFailed: number;
  pendingScheduled: number;
  successRate: number;
  schedulerStatus: 'ACTIVE' | 'IDLE';
  recentFailures: ReminderLog[];
}
