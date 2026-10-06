import { DbRepository } from '@/lib/database/repository';
import { ConversationContext } from '@/types';

export class ContextManager {
  /**
   * Set clarification context expiring in 15 minutes
   */
  static async setPendingContext(
    chatId: string,
    userId: string,
    contextType: string,
    data: Record<string, any>
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await DbRepository.setContext({
      chat_id: chatId,
      user_id: userId,
      context_type: contextType,
      context_data: data,
      expires_at: expiresAt,
    });
  }

  /**
   * Get active context for user in chat
   */
  static async getPendingContext(chatId: string, userId: string): Promise<ConversationContext | null> {
    return DbRepository.getContext(chatId, userId);
  }

  /**
   * Clear active context
   */
  static async clearContext(chatId: string, userId: string): Promise<void> {
    await DbRepository.clearContext(chatId, userId);
  }
}
