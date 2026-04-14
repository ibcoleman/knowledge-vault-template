// pattern: Functional Core

type MessageMeta = {
  readonly authorBot: boolean;
  readonly channelId: string;
};

/**
 * Determines whether a message should be processed based on filtering rules.
 * Filters out:
 * - Messages from bots (AC1.13)
 * - Messages from channels other than the configured one (AC1.14)
 *
 * @param meta Message metadata (bot status and channel ID)
 * @param configuredChannelId The Discord channel ID that should be monitored
 * @returns true if the message should be processed, false otherwise
 */
function shouldProcessMessage(meta: MessageMeta, configuredChannelId: string): boolean {
  if (meta.authorBot) return false;
  if (meta.channelId !== configuredChannelId) return false;
  return true;
}

export { shouldProcessMessage };
export type { MessageMeta };
