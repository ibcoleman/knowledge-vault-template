import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import {
  formatManifestFilename,
  buildManifestContent,
  manifestExistsForMessage,
  writeManifest,
} from './manifest.js';
import type { ManifestData } from './manifest.js';

describe('manifest builder and writer', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('formatManifestFilename', () => {
    it('formats filename as YYYY-MM-DD-{messageId}.md', () => {
      const timestamp = new Date('2026-04-05T14:30:00Z');
      const filename = formatManifestFilename('msg-123', timestamp);
      expect(filename).toBe('2026-04-05-msg-123.md');
    });

    it('uses ISO date format (YYYY-MM-DD)', () => {
      const timestamp = new Date('2025-12-31T23:59:59Z');
      const filename = formatManifestFilename('msg-456', timestamp);
      expect(filename).toBe('2025-12-31-msg-456.md');
    });
  });

  describe('buildManifestContent', () => {
    it('includes all required frontmatter fields for type url', () => {
      const data: ManifestData = {
        messageId: 'msg-123',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'url',
        content: 'https://example.com/article',
        attachments: [],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('discord_message_id: "msg-123"');
      expect(content).toContain('channel: "general"');
      expect(content).toContain('author: "alice"');
      expect(content).toContain('timestamp: 2026-04-05T14:30:00.000Z');
      expect(content).toContain('type: url');
    });

    it('includes message content in body for type url', () => {
      const data: ManifestData = {
        messageId: 'msg-123',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'url',
        content: 'https://example.com/article',
        attachments: [],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('https://example.com/article');
    });

    it('includes Attachments section for type image with image attachments', () => {
      const data: ManifestData = {
        messageId: 'msg-456',
        channelName: 'screenshots',
        authorUsername: 'bob',
        timestamp: new Date('2026-04-05T15:00:00Z'),
        type: 'image',
        content: 'Here is my screenshot',
        attachments: [
          {
            id: 'att-1',
            filename: 'screenshot.png',
            url: 'https://cdn.example.com/att-1',
            contentType: 'image/png',
          },
        ],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('## Attachments');
      expect(content).toContain('- [screenshot.png](images/msg-456-screenshot.png)');
    });

    it('uses proper image path format: images/{messageId}-{filename}', () => {
      const data: ManifestData = {
        messageId: 'msg-789',
        channelName: 'images',
        authorUsername: 'charlie',
        timestamp: new Date('2026-04-05T16:00:00Z'),
        type: 'image',
        content: 'Photo',
        attachments: [
          {
            id: 'att-2',
            filename: 'photo.jpg',
            url: 'https://cdn.example.com/att-2',
            contentType: 'image/jpeg',
          },
        ],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('- [photo.jpg](images/msg-789-photo.jpg)');
    });

    it('includes type note in frontmatter for plain text', () => {
      const data: ManifestData = {
        messageId: 'msg-note',
        channelName: 'general',
        authorUsername: 'diana',
        timestamp: new Date('2026-04-05T17:00:00Z'),
        type: 'note',
        content: 'Just a regular message',
        attachments: [],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('type: note');
      expect(content).toContain('Just a regular message');
    });

    it('does not include Attachments section for type note', () => {
      const data: ManifestData = {
        messageId: 'msg-note',
        channelName: 'general',
        authorUsername: 'diana',
        timestamp: new Date('2026-04-05T17:00:00Z'),
        type: 'note',
        content: 'Just a regular message',
        attachments: [],
      };

      const content = buildManifestContent(data);

      expect(content).not.toContain('## Attachments');
    });

    it('ends with newline', () => {
      const data: ManifestData = {
        messageId: 'msg-123',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'note',
        content: 'Test',
        attachments: [],
      };

      const content = buildManifestContent(data);

      expect(content).toMatch(/\n$/);
    });

    it('handles multiple image attachments', () => {
      const data: ManifestData = {
        messageId: 'msg-multi',
        channelName: 'images',
        authorUsername: 'eve',
        timestamp: new Date('2026-04-05T18:00:00Z'),
        type: 'image',
        content: 'Multiple images',
        attachments: [
          {
            id: 'att-3',
            filename: 'first.png',
            url: 'https://cdn.example.com/att-3',
            contentType: 'image/png',
          },
          {
            id: 'att-4',
            filename: 'second.jpg',
            url: 'https://cdn.example.com/att-4',
            contentType: 'image/jpeg',
          },
        ],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('- [first.png](images/msg-multi-first.png)');
      expect(content).toContain('- [second.jpg](images/msg-multi-second.jpg)');
    });

    it('separates image and file attachments into distinct sections', () => {
      const data: ManifestData = {
        messageId: 'msg-mixed',
        channelName: 'files',
        authorUsername: 'frank',
        timestamp: new Date('2026-04-05T19:00:00Z'),
        type: 'url',
        content: 'https://example.com',
        attachments: [
          {
            id: 'att-5',
            filename: 'image.png',
            url: 'https://cdn.example.com/att-5',
            contentType: 'image/png',
          },
          {
            id: 'att-6',
            filename: 'document.pdf',
            url: 'https://cdn.example.com/att-6',
            contentType: 'application/pdf',
          },
        ],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('## Attachments');
      expect(content).toContain('- [image.png](images/msg-mixed-image.png)');
      expect(content).toContain('## Files');
      expect(content).toContain('- [document.pdf](files/msg-mixed-document.pdf)');
    });

    it('includes Files section for file-only attachments', () => {
      const data: ManifestData = {
        messageId: 'msg-file',
        channelName: 'vault',
        authorUsername: 'ian',
        timestamp: new Date('2026-04-14T20:00:00Z'),
        type: 'file',
        content: 'Shared from Obsidian Web Clipper',
        attachments: [
          {
            id: 'att-7',
            filename: 'article.md',
            url: 'https://cdn.example.com/att-7',
            contentType: 'text/markdown',
          },
        ],
      };

      const content = buildManifestContent(data);

      expect(content).toContain('type: file');
      expect(content).toContain('## Files');
      expect(content).toContain('- [article.md](files/msg-file-article.md)');
      expect(content).not.toContain('## Attachments');
    });
  });

  describe('manifestExistsForMessage', () => {
    it('returns true when manifest for message exists', async () => {
      const timestamp = new Date('2026-04-05T14:30:00Z');
      const messageId = 'msg-123';
      const filename = formatManifestFilename(messageId, timestamp);

      // Create a dummy manifest file
      const filepath = join(tempDir, filename);
      const fs = await import('node:fs');
      fs.writeFileSync(filepath, 'content');

      expect(manifestExistsForMessage(tempDir, messageId)).toBe(true);
    });

    it('returns false when no manifest for message exists', () => {
      expect(manifestExistsForMessage(tempDir, 'nonexistent-msg')).toBe(false);
    });

    it('matches message ID at end of filename (date-independent)', async () => {
      const fs = await import('node:fs');

      // Create manifest with different date but same message ID
      const filepath1 = join(tempDir, '2026-04-01-msg-123.md');
      fs.writeFileSync(filepath1, 'old');

      // Should find it by message ID alone
      expect(manifestExistsForMessage(tempDir, 'msg-123')).toBe(true);
    });
  });

  describe('writeManifest', () => {
    it('writes manifest file with correct content (AC1.4: URL)', async () => {
      const data: ManifestData = {
        messageId: 'msg-url-1',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'url',
        content: 'https://example.com/article',
        attachments: [],
      };

      const result = writeManifest(tempDir, data);

      expect(result).not.toBeNull();
      expect(result).toContain('2026-04-05-msg-url-1.md');

      const content = readFileSync(result!, 'utf-8');
      expect(content).toContain('type: url');
      expect(content).toContain('https://example.com/article');
    });

    it('writes manifest file for image type (AC1.5)', async () => {
      const data: ManifestData = {
        messageId: 'msg-img-1',
        channelName: 'screenshots',
        authorUsername: 'bob',
        timestamp: new Date('2026-04-05T15:00:00Z'),
        type: 'image',
        content: 'Screenshot',
        attachments: [
          {
            id: 'att-1',
            filename: 'image.png',
            url: 'https://cdn.example.com/att-1',
            contentType: 'image/png',
          },
        ],
      };

      const result = writeManifest(tempDir, data);

      expect(result).not.toBeNull();

      const content = readFileSync(result!, 'utf-8');
      expect(content).toContain('type: image');
      expect(content).toContain('## Attachments');
    });

    it('returns file path on successful write', () => {
      const data: ManifestData = {
        messageId: 'msg-123',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'note',
        content: 'Test message',
        attachments: [],
      };

      const result = writeManifest(tempDir, data);

      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
      expect(result).toContain(tempDir);
      expect(result).toContain('.md');
    });

    it('returns null and skips when manifest for same message ID already exists (AC1.8)', async () => {
      const data: ManifestData = {
        messageId: 'msg-dup',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'note',
        content: 'First message',
        attachments: [],
      };

      // Write first manifest
      const first = writeManifest(tempDir, data);
      expect(first).not.toBeNull();

      // Try to write again with same message ID
      const second = writeManifest(tempDir, data);
      expect(second).toBeNull();

      // Verify only one file exists
      const files = readdirSync(tempDir);
      expect(files.length).toBe(1);
    });

    it('detects duplicate by message ID regardless of date', async () => {
      const data1: ManifestData = {
        messageId: 'msg-dup',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-05T14:30:00Z'),
        type: 'note',
        content: 'First',
        attachments: [],
      };

      const data2: ManifestData = {
        messageId: 'msg-dup',
        channelName: 'general',
        authorUsername: 'alice',
        timestamp: new Date('2026-04-06T14:30:00Z'),
        type: 'note',
        content: 'Second',
        attachments: [],
      };

      // Write first
      const first = writeManifest(tempDir, data1);
      expect(first).not.toBeNull();

      // Try to write second with same message ID but different timestamp
      const second = writeManifest(tempDir, data2);
      expect(second).toBeNull();
    });
  });
});
