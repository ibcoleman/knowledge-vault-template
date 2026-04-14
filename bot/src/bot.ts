// pattern: Imperative Shell
import 'dotenv/config';

import { Client, Events, GatewayIntentBits, ChannelType } from 'discord.js';
import { validateConfig } from './config.js';
import { ensureIntakeDirectories } from './intake.js';
import { shouldProcessMessage } from './handler.js';
import { processMessage } from './process-message.js';

async function main(): Promise<void> {
  // Step 1: Validate configuration
  const configResult = validateConfig(process.env);
  if (!configResult.ok) {
    console.error(
      `configuration error: ${configResult.error.variable} — ${configResult.error.message}`
    );
    process.exit(1);
  }

  const config = configResult.config;

  // Step 2: Ensure intake directories exist
  ensureIntakeDirectories(config.intakePath, config.intakeImagesPath, config.intakeFilesPath);

  // Step 3: Create Discord client with required intents
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  // Step 4: Register ready event handler
  client.on('ready', async (readyClient) => {
    try {
      // Fetch the channel to verify it exists and is accessible
      const channel = await readyClient.channels.fetch(config.discordChannelId);

      // Verify it's a valid text channel
      if (!channel || channel.type !== ChannelType.GuildText) {
        console.error(
          `channel verification failed: ${config.discordChannelId} is not a text channel or does not exist`
        );
        process.exit(1);
      }

      console.log(`Connected as ${readyClient.user.tag}, monitoring #${channel.name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `channel verification failed: ${config.discordChannelId} — ${errorMessage}`
      );
      process.exit(1);
    }
  });

  // Step 4b: Register messageCreate event handler (outside ready to avoid duplication on reconnect)
  client.on(Events.MessageCreate, async (message) => {
    // Filter messages: ignore bots and wrong channels (AC1.13, AC1.14)
    if (!shouldProcessMessage({ authorBot: message.author.bot, channelId: message.channelId }, config.discordChannelId)) {
      return;
    }

    // Convert discord.js attachments to plain data
    const attachments = Array.from(
      message.attachments.values()
    ).map((a) => ({
      id: a.id,
      filename: a.name,
      url: a.url,
      contentType: a.contentType,
    }));

    // Adapt Discord.js Message to MessageLike interface
    const messageLike = {
      id: message.id,
      author: message.author,
      attachments,
      channel: message.channel,
      content: message.content,
      createdAt: message.createdAt,
      react: async (emoji: string) => {
        await message.react(emoji);
      },
    };

    // Process the message (handles classification, downloads, manifest writing, and reactions)
    await processMessage(messageLike, {
      intakePath: config.intakePath,
      intakeImagesPath: config.intakeImagesPath,
      intakeFilesPath: config.intakeFilesPath,
    });
  });

  // Step 5: Register error event handler
  client.on('error', (error) => {
    console.error('discord client error:', error);
    process.exit(1);
  });

  // Step 6: Register unhandled rejection handler
  process.on('unhandledRejection', (reason) => {
    console.error('unhandled promise rejection:', reason);
    process.exit(1);
  });

  // Step 7: Attempt to log in
  try {
    await client.login(config.discordBotToken);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`failed to login: ${errorMessage}`);
    process.exit(1);
  }
}

main();
