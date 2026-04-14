// pattern: Imperative Shell
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AttachmentInfo } from './classify.js';

type DownloadResult =
  | { readonly ok: true; readonly localPath: string }
  | { readonly ok: false; readonly error: string };

async function downloadAttachment(
  attachment: AttachmentInfo,
  messageId: string,
  intakeImagesPath: string,
): Promise<DownloadResult> {
  const filename = `${messageId}-${attachment.filename}`;
  const localPath = join(intakeImagesPath, filename);

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status} downloading ${attachment.filename}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(localPath, buffer);
    return { ok: true, localPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Failed to download ${attachment.filename}: ${message}` };
  }
}

async function downloadAllAttachments(
  attachments: ReadonlyArray<AttachmentInfo>,
  messageId: string,
  intakeImagesPath: string,
): Promise<ReadonlyArray<DownloadResult>> {
  const results: Array<DownloadResult> = [];
  for (const attachment of attachments) {
    const result = await downloadAttachment(attachment, messageId, intakeImagesPath);
    results.push(result);
  }
  return results;
}

export { downloadAttachment, downloadAllAttachments };
export type { DownloadResult };
