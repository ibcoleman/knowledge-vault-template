import { describe, it, expect } from 'vitest';
import { classifyMessage, extractUrls, URL_PATTERN_SOURCE } from './classify.js';
import type { ClassifyInput } from './classify.js';

describe('classifyMessage', () => {
  describe('AC1.4: URL detection', () => {
    it('returns "url" for https:// URL in content', () => {
      const input: ClassifyInput = {
        content: 'Check this out: https://example.com/article',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('url');
    });

    it('returns "url" for http:// URL in content', () => {
      const input: ClassifyInput = {
        content: 'Found this: http://example.com/page',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('url');
    });

    it('returns "url" for multiple URLs in content', () => {
      const input: ClassifyInput = {
        content: 'https://example.com and http://other.com',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('url');
    });
  });

  describe('AC1.5: Image detection', () => {
    it('returns "image" for message with image attachment and no URL', () => {
      const input: ClassifyInput = {
        content: 'Look at this screenshot',
        attachments: [
          {
            id: 'att-1',
            filename: 'screenshot.png',
            url: 'https://cdn.example.com/att-1',
            contentType: 'image/png',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('image');
    });

    it('returns "image" for message with image/jpeg', () => {
      const input: ClassifyInput = {
        content: 'My photo',
        attachments: [
          {
            id: 'att-2',
            filename: 'photo.jpg',
            url: 'https://cdn.example.com/att-2',
            contentType: 'image/jpeg',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('image');
    });

    it('classifies non-image attachments as file, not note', () => {
      const input: ClassifyInput = {
        content: 'Document attached',
        attachments: [
          {
            id: 'att-3',
            filename: 'doc.pdf',
            url: 'https://cdn.example.com/att-3',
            contentType: 'application/pdf',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('file');
    });

    it('handles null contentType as file', () => {
      const input: ClassifyInput = {
        content: 'Attachment with null type',
        attachments: [
          {
            id: 'att-4',
            filename: 'file',
            url: 'https://cdn.example.com/att-4',
            contentType: null,
          },
        ],
      };
      expect(classifyMessage(input)).toBe('file');
    });
  });

  describe('File detection', () => {
    it('returns "file" for message with .md file attachment', () => {
      const input: ClassifyInput = {
        content: 'Shared from Obsidian Web Clipper',
        attachments: [
          {
            id: 'att-md',
            filename: 'article.md',
            url: 'https://cdn.example.com/att-md',
            contentType: 'text/markdown',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('file');
    });

    it('returns "image" when both image and file attachments are present', () => {
      const input: ClassifyInput = {
        content: 'Mixed attachments',
        attachments: [
          {
            id: 'att-img',
            filename: 'photo.png',
            url: 'https://cdn.example.com/att-img',
            contentType: 'image/png',
          },
          {
            id: 'att-file',
            filename: 'notes.md',
            url: 'https://cdn.example.com/att-file',
            contentType: 'text/markdown',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('image');
    });
  });

  describe('AC1.6: URL takes precedence over image', () => {
    it('returns "url" when both URL and image are present', () => {
      const input: ClassifyInput = {
        content: 'Here is a screenshot: https://example.com/screenshot',
        attachments: [
          {
            id: 'att-5',
            filename: 'image.png',
            url: 'https://cdn.example.com/att-5',
            contentType: 'image/png',
          },
        ],
      };
      expect(classifyMessage(input)).toBe('url');
    });
  });

  describe('AC1.7: Note detection (plain text)', () => {
    it('returns "note" for plain text message', () => {
      const input: ClassifyInput = {
        content: 'Just a regular message with no URLs or attachments',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('note');
    });

    it('returns "note" for empty message', () => {
      const input: ClassifyInput = {
        content: '',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('note');
    });

    it('returns "note" for whitespace-only message', () => {
      const input: ClassifyInput = {
        content: '   \n\t  ',
        attachments: [],
      };
      expect(classifyMessage(input)).toBe('note');
    });
  });

  describe('extractUrls', () => {
    it('returns all URLs found in content', () => {
      const content = 'Check https://example.com and http://other.org/path?query=value';
      const urls = extractUrls(content);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('http://other.org/path?query=value');
    });

    it('returns empty array when no URLs found', () => {
      const urls = extractUrls('Just plain text');
      expect(urls).toEqual([]);
    });

    it('extracts URLs with complex paths and query strings', () => {
      const content =
        'See https://example.com/path/to/page?foo=bar&baz=qux#section for details';
      const urls = extractUrls(content);
      expect(urls).toContain('https://example.com/path/to/page?foo=bar&baz=qux#section');
    });
  });

  describe('URL_PATTERN_SOURCE', () => {
    it('can extract multiple occurrences in a single content string', () => {
      const content = 'First https://example.com then https://other.com end';
      const pattern = new RegExp(URL_PATTERN_SOURCE, 'gi');
      const matches = content.match(pattern);
      expect(matches?.length).toBe(2);
      expect(matches).toContain('https://example.com');
      expect(matches).toContain('https://other.com');
    });
  });
});
