import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync } from 'node:fs';
import { validateConfig } from './config.js';

describe('validateConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(tmpdir() + '/vault-test-');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('DISCORD_BOT_TOKEN validation', () => {
    it('returns error when DISCORD_BOT_TOKEN is missing', () => {
      const env = { DISCORD_CHANNEL_ID: 'ch123', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.variable).toBe('DISCORD_BOT_TOKEN');
        expect(result.error.message).toContain('required');
      }
    });

    it('returns error when DISCORD_BOT_TOKEN is empty string', () => {
      const env = { DISCORD_BOT_TOKEN: '', DISCORD_CHANNEL_ID: 'ch123', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.variable).toBe('DISCORD_BOT_TOKEN');
      }
    });
  });

  describe('DISCORD_CHANNEL_ID validation', () => {
    it('returns error when DISCORD_CHANNEL_ID is missing', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.variable).toBe('DISCORD_CHANNEL_ID');
        expect(result.error.message).toContain('required');
      }
    });

    it('returns error when DISCORD_CHANNEL_ID is empty string', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', DISCORD_CHANNEL_ID: '', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.variable).toBe('DISCORD_CHANNEL_ID');
      }
    });
  });

  describe('VAULT_PATH validation', () => {
    it('returns error when VAULT_PATH directory does not exist', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', DISCORD_CHANNEL_ID: 'ch123', VAULT_PATH: '/nonexistent/path' };
      const result = validateConfig(env);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.variable).toBe('VAULT_PATH');
        expect(result.error.message).toContain('does not exist');
      }
    });

    it('defaults to cwd when VAULT_PATH is not set', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', DISCORD_CHANNEL_ID: 'ch123' };
      const result = validateConfig(env);
      expect(result.ok).toBe(true);
      // When not set, it defaults to cwd which should exist
    });
  });

  describe('successful validation', () => {
    it('returns valid config when all required fields are present', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', DISCORD_CHANNEL_ID: 'ch123', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.discordBotToken).toBe('token123');
        expect(result.config.discordChannelId).toBe('ch123');
        expect(result.config.vaultPath).toBe(tempDir);
        expect(result.config.intakePath).toContain('intake');
        expect(result.config.intakeImagesPath).toContain('images');
      }
    });

    it('constructs correct intake and image paths from VAULT_PATH', () => {
      const env = { DISCORD_BOT_TOKEN: 'token123', DISCORD_CHANNEL_ID: 'ch123', VAULT_PATH: tempDir };
      const result = validateConfig(env);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.intakePath).toBe(tempDir + '/intake');
        expect(result.config.intakeImagesPath).toBe(tempDir + '/intake/images');
      }
    });
  });
});
