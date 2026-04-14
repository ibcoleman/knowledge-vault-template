// pattern: Imperative Shell
// Extracted message processing logic with reactions for testability.
// Accepts a message-like interface (duck-typed) to avoid direct discord.js dependencies in tests.

import { classifyMessage } from './classify.js';
import { writeManifest } from './manifest.js';
import { downloadAllAttachments } from './download.js';
import type { AttachmentInfo } from './classify.js';
import type { ManifestData } from './manifest.js';

/**
 * Message-like interface for testing.
 * Must have: id, author, attachments, channel, content, createdAt, react
 */
type MessageLike = {
  readonly id: string;
  readonly author: {
    readonly bot: boolean;
    readonly username: string;
  };
  readonly attachments: ReadonlyArray<AttachmentInfo>;
  readonly channel: {
    readonly isDMBased: () => boolean;
    readonly name?: string;
  };
  readonly content: string;
  readonly createdAt: Date;
  react: (emoji: string) => Promise<void>;
};

type ProcessMessageOptions = {
  intakePath: string;
  intakeImagesPath: string;
  intakeFilesPath: string;
};

/**
 * Processes a Discord message: classifies, downloads attachments, writes manifest, adds reaction.
 * Returns true if successful (including duplicates), false if error.
 * Side effects: writes to disk, calls react() on the message object.
 *
 * @param message Message-like object with react method
 * @param options Configuration paths
 * @returns true if processing succeeded (manifest written or skipped as duplicate), false if error
 * @throws Does not throw; handles all errors internally and returns false
 */
async function processMessage(
  message: MessageLike,
  options: ProcessMessageOptions
): Promise<boolean> {
  try {
    const attachments: ReadonlyArray<AttachmentInfo> = message.attachments;

    const type = classifyMessage({
      content: message.content,
      attachments,
    });

    // Split attachments into images and files
    const imageAttachments = attachments.filter(
      (a) => a.contentType?.startsWith('image/') ?? false
    );
    const fileAttachments = attachments.filter(
      (a) => !(a.contentType?.startsWith('image/') ?? false)
    );

    // Download image attachments to images/
    if (imageAttachments.length > 0) {
      const downloadResults = await downloadAllAttachments(
        imageAttachments,
        message.id,
        options.intakeImagesPath
      );
      const failures = downloadResults.filter((r) => !r.ok);
      if (failures.length > 0) {
        for (const f of failures) {
          if (!f.ok) console.error(f.error);
        }
        throw new Error(`Failed to download ${failures.length} image attachment(s)`);
      }
    }

    // Download file attachments to files/
    if (fileAttachments.length > 0) {
      const downloadResults = await downloadAllAttachments(
        fileAttachments,
        message.id,
        options.intakeFilesPath
      );
      const failures = downloadResults.filter((r) => !r.ok);
      if (failures.length > 0) {
        for (const f of failures) {
          if (!f.ok) console.error(f.error);
        }
        throw new Error(`Failed to download ${failures.length} file attachment(s)`);
      }
    }

    const manifestData: ManifestData = {
      messageId: message.id,
      channelName: message.channel.isDMBased() ? 'dm' : (message.channel.name ?? 'unknown'),
      authorUsername: message.author.username,
      timestamp: message.createdAt,
      type,
      content: message.content,
      attachments,
    };

    const result = writeManifest(options.intakePath, manifestData);
    if (result === null) {
      console.log(`Skipped duplicate: ${message.id}`);
    } else {
      console.log(`Saved manifest: ${result}`);
    }

    // React with ✅ on success (both new manifest and duplicate paths)
    try {
      await message.react('✅');
    } catch (reactError) {
      console.error(`Failed to add ✅ reaction:`, reactError);
      // Don't fail the whole operation if react fails - manifest was still written
    }
    return true;
  } catch (error) {
    console.error(`Error processing message ${message.id}:`, error);
    try {
      // React with ❌ on failure
      await message.react('❌');
    } catch (reactError) {
      console.error(`Failed to add ❌ reaction:`, reactError);
    }
    return false;
  }
}

export { processMessage };
export type { MessageLike, ProcessMessageOptions };
