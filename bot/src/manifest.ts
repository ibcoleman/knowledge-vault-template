// pattern: Imperative Shell
import { writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { MessageType, AttachmentInfo } from './classify.js';

type ManifestData = {
  readonly messageId: string;
  readonly channelName: string;
  readonly authorUsername: string;
  readonly timestamp: Date;
  readonly type: MessageType;
  readonly content: string;
  readonly attachments: ReadonlyArray<AttachmentInfo>;
};

/**
 * Formats a manifest filename as YYYY-MM-DD-{messageId}.md
 * Uses ISO date format for consistent sorting.
 */
function formatManifestFilename(messageId: string, timestamp: Date): string {
  const date = timestamp.toISOString().slice(0, 10);
  return `${date}-${messageId}.md`;
}

/**
 * Builds manifest YAML frontmatter and content.
 * Includes Attachments section for image attachments.
 */
function buildManifestContent(data: ManifestData): string {
  const isoTimestamp = data.timestamp.toISOString();

  const lines: Array<string> = [
    '---',
    `discord_message_id: "${data.messageId}"`,
    `channel: "${data.channelName}"`,
    `author: "${data.authorUsername}"`,
    `timestamp: ${isoTimestamp}`,
    `type: ${data.type}`,
    '---',
    '',
    data.content,
  ];

  const imageAttachments = data.attachments.filter(
    (a) => a.contentType?.startsWith('image/') ?? false
  );

  const fileAttachments = data.attachments.filter(
    (a) => !(a.contentType?.startsWith('image/') ?? false)
  );

  if (imageAttachments.length > 0) {
    lines.push('', '## Attachments', '');
    for (const att of imageAttachments) {
      const localPath = `images/${data.messageId}-${att.filename}`;
      lines.push(`- [${att.filename}](${localPath})`);
    }
  }

  if (fileAttachments.length > 0) {
    lines.push('', '## Files', '');
    for (const att of fileAttachments) {
      const localPath = `files/${data.messageId}-${att.filename}`;
      lines.push(`- [${att.filename}](${localPath})`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Checks if a manifest file already exists for a given message ID.
 * Returns true if any file ending with -{messageId}.md is found.
 */
function manifestExistsForMessage(intakePath: string, messageId: string): boolean {
  try {
    const files = readdirSync(intakePath);
    return files.some((f) => f.endsWith(`-${messageId}.md`));
  } catch {
    // Directory doesn't exist or can't be read
    return false;
  }
}

/**
 * Writes a manifest file to disk with idempotency check.
 * Returns the file path on success, null if duplicate message ID.
 */
function writeManifest(intakePath: string, data: ManifestData): string | null {
  if (manifestExistsForMessage(intakePath, data.messageId)) {
    return null; // skip duplicate
  }

  const filename = formatManifestFilename(data.messageId, data.timestamp);
  const filepath = join(intakePath, filename);
  const content = buildManifestContent(data);
  writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

export { formatManifestFilename, buildManifestContent, manifestExistsForMessage, writeManifest };
export type { ManifestData };
