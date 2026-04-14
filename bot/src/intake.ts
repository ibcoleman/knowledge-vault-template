// pattern: Imperative Shell
import { mkdirSync } from 'node:fs';

function ensureIntakeDirectories(intakePath: string, intakeImagesPath: string, intakeFilesPath?: string): void {
  mkdirSync(intakePath, { recursive: true });
  mkdirSync(intakeImagesPath, { recursive: true });
  if (intakeFilesPath) {
    mkdirSync(intakeFilesPath, { recursive: true });
  }
}

export { ensureIntakeDirectories };
