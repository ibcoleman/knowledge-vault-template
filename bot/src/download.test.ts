import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { downloadAttachment, downloadAllAttachments } from './download.js';
import type { AttachmentInfo } from './classify.js';
import type { DownloadResult } from './download.js';

describe('downloadAttachment', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'download-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('AC1.9: Successful download', () => {
    it('downloads image and saves to intakeImagesPath/{messageId}-{filename}', async () => {
      const attachment: AttachmentInfo = {
        id: 'att-1',
        filename: 'test.png',
        url: 'https://example.com/image.png',
        contentType: 'image/png',
      };
      const messageId = 'msg-123';
      const imageBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValueOnce(imageBuffer),
        })
      );

      const result = await downloadAttachment(attachment, messageId, tempDir);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.localPath).toBe(join(tempDir, 'msg-123-test.png'));
      }
    });

    it('downloaded file content matches source', async () => {
      const attachment: AttachmentInfo = {
        id: 'att-2',
        filename: 'photo.jpg',
        url: 'https://example.com/photo.jpg',
        contentType: 'image/jpeg',
      };
      const messageId = 'msg-456';
      const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValueOnce(imageBuffer),
        })
      );

      const result = await downloadAttachment(attachment, messageId, tempDir);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const { readFileSync } = await import('node:fs');
        const fileContent = readFileSync(result.localPath);
        expect(fileContent).toEqual(imageBuffer);
      }
    });
  });

  describe('AC1.10: HTTP error response', () => {
    it('returns error on HTTP 404 with descriptive message', async () => {
      const attachment: AttachmentInfo = {
        id: 'att-3',
        filename: 'missing.png',
        url: 'https://example.com/missing.png',
        contentType: 'image/png',
      };
      const messageId = 'msg-789';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
      );

      const result = await downloadAttachment(attachment, messageId, tempDir);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('HTTP 404');
        expect(result.error).toContain('missing.png');
      }
    });

    it('returns error on HTTP 500 with descriptive message', async () => {
      const attachment: AttachmentInfo = {
        id: 'att-4',
        filename: 'error.png',
        url: 'https://example.com/error.png',
        contentType: 'image/png',
      };
      const messageId = 'msg-999';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
      );

      const result = await downloadAttachment(attachment, messageId, tempDir);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('HTTP 500');
        expect(result.error).toContain('error.png');
      }
    });
  });

  describe('AC1.10: Network error', () => {
    it('returns error on network failure with descriptive message', async () => {
      const attachment: AttachmentInfo = {
        id: 'att-5',
        filename: 'network-fail.png',
        url: 'https://example.com/network-fail.png',
        contentType: 'image/png',
      };
      const messageId = 'msg-111';

      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'))
      );

      const result = await downloadAttachment(attachment, messageId, tempDir);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Failed to download');
        expect(result.error).toContain('network-fail.png');
        expect(result.error).toContain('ECONNREFUSED');
      }
    });
  });
});

describe('downloadAllAttachments', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'download-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns results for each attachment in order', async () => {
    const attachments: Array<AttachmentInfo> = [
      {
        id: 'att-1',
        filename: 'first.png',
        url: 'https://example.com/first.png',
        contentType: 'image/png',
      },
      {
        id: 'att-2',
        filename: 'second.jpg',
        url: 'https://example.com/second.jpg',
        contentType: 'image/jpeg',
      },
    ];
    const messageId = 'msg-batch';

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('first.png')) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(Buffer.from([1, 2, 3])),
        });
      }
      if (url.includes('second.jpg')) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(Buffer.from([4, 5, 6])),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    }));

    const results = await downloadAllAttachments(attachments, messageId, tempDir);

    expect(results).toHaveLength(2);
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(true);
    const result0 = results[0];
    const result1 = results[1];
    if (result0 !== undefined && result0.ok && result1 !== undefined && result1.ok) {
      expect(result0.localPath).toContain('first.png');
      expect(result1.localPath).toContain('second.jpg');
    }
  });

  it('returns empty array when given no attachments', async () => {
    const results = await downloadAllAttachments([], 'msg-x', tempDir);

    expect(results).toEqual([]);
  });

  it('preserves mixed success and failure results', async () => {
    const attachments: Array<AttachmentInfo> = [
      {
        id: 'att-1',
        filename: 'success.png',
        url: 'https://example.com/success.png',
        contentType: 'image/png',
      },
      {
        id: 'att-2',
        filename: 'fail.jpg',
        url: 'https://example.com/fail.jpg',
        contentType: 'image/jpeg',
      },
    ];
    const messageId = 'msg-mixed';

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('success.png')) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(Buffer.from([1, 2, 3])),
        });
      }
      if (url.includes('fail.jpg')) {
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }
      return Promise.resolve({ ok: false, status: 500 });
    }));

    const results = await downloadAllAttachments(attachments, messageId, tempDir);

    expect(results).toHaveLength(2);
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(false);
    const failResult = results[1];
    if (failResult !== undefined && !failResult.ok) {
      expect(failResult.error).toContain('HTTP 404');
    }
  });
});
