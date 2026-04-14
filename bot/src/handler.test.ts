import { describe, it, expect } from 'vitest';
import { shouldProcessMessage } from './handler.js';
import type { MessageMeta } from './handler.js';

describe('shouldProcessMessage', () => {
  const configuredChannelId = 'channel-123';

  describe('AC1.13: Bot message filtering', () => {
    it('returns false when message is from a bot', () => {
      const meta: MessageMeta = {
        authorBot: true,
        channelId: configuredChannelId,
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(false);
    });

    it('returns true when message is from a non-bot user', () => {
      const meta: MessageMeta = {
        authorBot: false,
        channelId: configuredChannelId,
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(true);
    });
  });

  describe('AC1.14: Channel filtering', () => {
    it('returns false when message is in wrong channel', () => {
      const meta: MessageMeta = {
        authorBot: false,
        channelId: 'wrong-channel-456',
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(false);
    });

    it('returns true when message is in configured channel', () => {
      const meta: MessageMeta = {
        authorBot: false,
        channelId: configuredChannelId,
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(true);
    });
  });

  describe('Combined filtering', () => {
    it('returns false when bot message in configured channel', () => {
      const meta: MessageMeta = {
        authorBot: true,
        channelId: configuredChannelId,
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(false);
    });

    it('returns false when non-bot message in wrong channel', () => {
      const meta: MessageMeta = {
        authorBot: false,
        channelId: 'other-channel',
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(false);
    });

    it('returns false when bot message in wrong channel', () => {
      const meta: MessageMeta = {
        authorBot: true,
        channelId: 'other-channel',
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(false);
    });

    it('returns true only when non-bot and correct channel', () => {
      const meta: MessageMeta = {
        authorBot: false,
        channelId: configuredChannelId,
      };
      expect(shouldProcessMessage(meta, configuredChannelId)).toBe(true);
    });
  });
});
