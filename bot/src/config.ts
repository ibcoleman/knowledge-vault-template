// pattern: Functional Core
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

type BotConfig = {
  readonly discordBotToken: string;
  readonly discordChannelId: string;
  readonly vaultPath: string;
  readonly intakePath: string;
  readonly intakeImagesPath: string;
  readonly intakeFilesPath: string;
};

type ConfigError = {
  readonly variable: string;
  readonly message: string;
};

type ConfigResult =
  | { readonly ok: true; readonly config: BotConfig }
  | { readonly ok: false; readonly error: ConfigError };

function validateConfig(env: Record<string, string | undefined>): ConfigResult {
  const token = env['DISCORD_BOT_TOKEN'];
  if (!token) {
    return { ok: false, error: { variable: 'DISCORD_BOT_TOKEN', message: 'DISCORD_BOT_TOKEN is required but missing or empty' } };
  }

  const channelId = env['DISCORD_CHANNEL_ID'];
  if (!channelId) {
    return { ok: false, error: { variable: 'DISCORD_CHANNEL_ID', message: 'DISCORD_CHANNEL_ID is required but missing or empty' } };
  }

  const vaultPath = resolve(env['VAULT_PATH'] ?? process.cwd());
  if (!existsSync(vaultPath)) {
    return { ok: false, error: { variable: 'VAULT_PATH', message: `VAULT_PATH directory does not exist: ${vaultPath}` } };
  }

  const intakePath = resolve(vaultPath, 'intake');
  const intakeImagesPath = resolve(intakePath, 'images');
  const intakeFilesPath = resolve(intakePath, 'files');

  return {
    ok: true,
    config: { discordBotToken: token, discordChannelId: channelId, vaultPath, intakePath, intakeImagesPath, intakeFilesPath },
  };
}

export { validateConfig };
export type { BotConfig, ConfigError, ConfigResult };
