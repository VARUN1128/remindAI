import { MessagingProvider } from '@/types';

/**
 * Global Registry for Messaging Providers
 */
class MessagingRegistry {
  private providers: Map<string, MessagingProvider> = new Map();

  public register(provider: MessagingProvider) {
    this.providers.set(provider.name, provider);
  }

  public get(name: string): MessagingProvider | undefined {
    return this.providers.get(name);
  }

  public getDefault(): MessagingProvider {
    const telegram = this.providers.get('telegram');
    if (telegram) return telegram;
    throw new Error('No default messaging provider registered');
  }
}

export const messagingRegistry = new MessagingRegistry();
