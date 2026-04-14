// pattern: Functional Core

type MessageType = 'url' | 'image' | 'file' | 'note';

type AttachmentInfo = {
  readonly id: string;
  readonly filename: string;
  readonly url: string;
  readonly contentType: string | null;
};

type ClassifyInput = {
  readonly content: string;
  readonly attachments: ReadonlyArray<AttachmentInfo>;
};

/**
 * URL regex source: matches http:// or https:// URLs in message text.
 * Intentionally simple — matches common URLs, not every edge case per RFC 3986.
 *
 * Exported as a string constant for tests. Functions create fresh RegExp
 * instances internally to avoid shared lastIndex state hazards.
 */
const URL_PATTERN_SOURCE = 'https?://[^\\s<>]+';

function createUrlPattern(): RegExp {
  return new RegExp(URL_PATTERN_SOURCE, 'gi');
}

/**
 * Classifies a message based on its content and attachments.
 * Returns the highest-priority type: URL > image > note.
 *
 * @param input Message content and attachments (plain data, not discord.js types)
 * @returns Message type: 'url', 'image', or 'note'
 */
function classifyMessage(input: ClassifyInput): MessageType {
  const hasUrl = createUrlPattern().test(input.content);

  const hasImage = input.attachments.some(
    (a) => a.contentType?.startsWith('image/') ?? false
  );

  const hasFile = input.attachments.some(
    (a) => !(a.contentType?.startsWith('image/') ?? false)
  );

  if (hasUrl) return 'url';
  if (hasImage) return 'image';
  if (hasFile) return 'file';
  return 'note';
}

/**
 * Extracts all URLs found in message content.
 *
 * @param content Message text to search for URLs
 * @returns Array of URLs found in the content
 */
function extractUrls(content: string): Array<string> {
  return content.match(createUrlPattern()) ?? [];
}

export { classifyMessage, extractUrls, URL_PATTERN_SOURCE };
export type { MessageType, AttachmentInfo, ClassifyInput };
