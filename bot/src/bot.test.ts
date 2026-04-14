import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { processMessage } from './process-message.js';
import type { MessageLike, ProcessMessageOptions } from './process-message.js';

describe('processMessage', () => {
  let tempDir: string;
  let intakeDir: string;
  let imagesDir: string;
  let filesDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-test-'));
    intakeDir = join(tempDir, 'intake');
    imagesDir = join(intakeDir, 'images');
    filesDir = join(intakeDir, 'files');
    await mkdir(intakeDir, { recursive: true });
    await mkdir(imagesDir, { recursive: true });
    await mkdir(filesDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper to create a stub message with recorded reactions.
   * Simulates a Discord message with a react method.
   */
  function createStubMessage(overrides?: Partial<MessageLike>): MessageLike & { reactions: string[] } {
    const reactions: string[] = [];
    return {
      id: 'msg-123',
      author: {
        bot: false,
        username: 'testuser',
      },
      attachments: [],
      channel: {
        isDMBased: () => false,
        name: 'test-channel',
      },
      content: 'test message',
      createdAt: new Date('2026-04-05T10:00:00Z'),
      react: async (emoji: string) => {
        reactions.push(emoji);
      },
      reactions,
      ...overrides,
    };
  }

  it('reacts with ✅ on successful manifest write', async () => {
    const message = createStubMessage({
      id: 'msg-success',
      content: 'https://example.com',
      attachments: [],
    });

    const options: ProcessMessageOptions = {
      intakePath: intakeDir,
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    const result = await processMessage(message, options);

    // Verify success return value
    expect(result).toBe(true);
    // Verify ✅ reaction recorded
    expect(message.reactions).toContain('✅');
    // Verify ❌ was not recorded
    expect(message.reactions).not.toContain('❌');
  });

  it('reacts with ✅ on duplicate message (no error)', async () => {
    const messageId = 'msg-duplicate';
    const timestamp = new Date('2026-04-05T10:00:00Z');

    // Pre-create a manifest file to simulate a duplicate
    const filename = `${timestamp.toISOString().slice(0, 10)}-${messageId}.md`;
    const filepath = join(intakeDir, filename);
    await writeFile(filepath, 'existing content', 'utf-8');

    const message = createStubMessage({
      id: messageId,
      content: 'https://example.com',
      attachments: [],
      createdAt: timestamp,
    });

    const options: ProcessMessageOptions = {
      intakePath: intakeDir,
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    const result = await processMessage(message, options);

    // Verify success return value (duplicate is not an error)
    expect(result).toBe(true);
    // Verify ✅ reaction recorded (not ❌)
    expect(message.reactions).toContain('✅');
    expect(message.reactions).not.toContain('❌');
  });

  it('reacts with ❌ when message processing throws an error', async () => {
    // Create a message with invalid content that will cause classification to fail
    // Actually, classifyMessage is resilient. Let's throw during download instead.
    // We'll create an invalid/unwritable directory path to trigger writeManifest failure.
    const message = createStubMessage({
      id: 'msg-error',
      content: 'test',
      attachments: [],
    });

    // Use an invalid path that will cause writeManifest to fail
    const options: ProcessMessageOptions = {
      intakePath: '/nonexistent/path/that/does/not/exist',
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    const result = await processMessage(message, options);

    // Verify failure return value
    expect(result).toBe(false);
    // Verify ❌ reaction recorded
    expect(message.reactions).toContain('❌');
    // Verify ✅ was not recorded
    expect(message.reactions).not.toContain('✅');
  });

  it('handles react() permission errors gracefully', async () => {
    const message = createStubMessage({
      id: 'msg-react-error',
      content: 'https://example.com',
      attachments: [],
      react: async () => {
        throw new Error('Missing permissions to add reaction');
      },
    });

    const options: ProcessMessageOptions = {
      intakePath: intakeDir,
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    // Should not throw, even though react() fails
    const result = await processMessage(message, options);

    // Process still succeeds (react failure is caught and logged)
    expect(result).toBe(true);
  });

  it('classifies and writes manifest for URL type message', async () => {
    const message = createStubMessage({
      id: 'msg-url',
      content: 'Check this out: https://example.com/article',
      attachments: [],
      createdAt: new Date('2026-04-05T10:00:00Z'),
    });

    const options: ProcessMessageOptions = {
      intakePath: intakeDir,
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    const result = await processMessage(message, options);

    expect(result).toBe(true);
    expect(message.reactions).toContain('✅');

    // Verify manifest file was written
    const fs = await import('node:fs/promises');
    const files = await fs.readdir(intakeDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toContain('msg-url');
    expect(files[0]).toMatch(/\.md$/);
  });

  it('classifies and writes manifest for note type message', async () => {
    const message = createStubMessage({
      id: 'msg-note',
      content: 'Just a regular message with no URL',
      attachments: [],
      createdAt: new Date('2026-04-05T11:00:00Z'),
    });

    const options: ProcessMessageOptions = {
      intakePath: intakeDir,
      intakeImagesPath: imagesDir,
      intakeFilesPath: filesDir,
    };

    const result = await processMessage(message, options);

    expect(result).toBe(true);
    expect(message.reactions).toContain('✅');

    // Verify manifest file was written
    const fs = await import('node:fs/promises');
    const files = await fs.readdir(intakeDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toContain('msg-note');
  });
});
