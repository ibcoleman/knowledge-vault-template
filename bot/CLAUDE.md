# Discord Intake Bot

Last verified: 2026-04-06

## Purpose
Listens to a single Discord channel and saves captures (URLs, images, notes) as manifest
files in `intake/` for the vault's "Process Intake" workflow to consume.

## Contracts
- **Exposes**: `bot.ts` entry point (started via `npm start` or pm2 `ecosystem.config.cjs`)
- **Guarantees**: Each Discord message produces exactly one manifest file named
  `YYYY-MM-DD-{messageId}.md` in `intake/`. Idempotent — duplicate message IDs are
  silently skipped. On success the original message receives a ✅ reaction; on failure ❌.
- **Expects**: Environment variables `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, and
  optionally `VAULT_PATH` (defaults to `cwd`). `intake/` and `intake/images/` are
  created automatically on startup.

## Manifest Format
Frontmatter fields: `discord_message_id`, `channel`, `author`, `timestamp`, `type`
(`url` | `image` | `file` | `note`). Image attachments listed under `## Attachments` as
relative paths under `images/{messageId}-{filename}`. Non-image file attachments listed
under `## Files` as relative paths under `files/{messageId}-{filename}`.

## Dependencies
- **Uses**: `discord.js` ^14, `dotenv`; writes to `../intake/` (vault-relative)
- **Used by**: Vault "Process Intake" workflow reads `intake/*.md`
- **Boundary**: No knowledge of wiki structure, daily pages, or vault workflows

## Key Decisions
- Functional Core / Imperative Shell: `classify.ts`, `handler.ts`, `manifest.ts`
  (pure functions) vs `bot.ts`, `intake.ts`, `download.ts` (I/O)
- `MessageLike` duck-type interface in `process-message.ts` keeps discord.js out of tests
- Classification priority: URL > image > file > note

## Invariants
- Bot only processes messages from the single configured channel (ignores all others)
- Bot messages are always ignored (never self-processes)
- Manifest filename always starts with ISO date for chronological sort

## Key Files
- `src/bot.ts` — entry point, Discord client setup, imperative shell
- `src/config.ts` — environment validation, `BotConfig` type
- `src/classify.ts` — message type classification (pure)
- `src/manifest.ts` — manifest file writing with idempotency check
- `src/process-message.ts` — orchestrates classify → download → write → react
- `ecosystem.config.cjs` — pm2 process config for production

## Commands
- `npm test` — run Vitest suite
- `npm run typecheck` — TypeScript type check (no emit)
- `npm start` — run bot via tsx (dev)
- `pm2 start ecosystem.config.cjs` — run in production
