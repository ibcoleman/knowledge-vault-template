# Knowledge Vault

A personal knowledge base maintained by Claude Code. You clip articles and take notes; Claude organizes them into an interlinked wiki you browse in Obsidian.

## How it works

```
You clip an article          Discord bot              Claude Code
  (Obsidian Web Clipper)  →  catches it, saves    →  processes into
  or type a note              a manifest file         wiki pages
       ↓                          ↓                       ↓
   Discord channel           intake/ directory       wiki/ directory
                                                         ↓
                                                    You read in Obsidian
```

Content flows inbound only. You capture; Claude organizes; you read.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Obsidian](https://obsidian.md/) (free, for reading/browsing the wiki)
- [Claude Code Pro subscription](https://claude.ai/) (for the Claude CLI)
- A Discord account (for the capture pipeline)

## Setup

### 1. Clone this repo

```bash
git clone <this-repo-url> my-vault
cd my-vault
```

### 2. Create a Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application", give it a name (e.g., "My Vault Bot")
3. Go to **Bot** → click "Reset Token" → copy the token
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**
5. Go to **OAuth2** → **URL Generator** → select `bot` scope → select permissions: `Read Messages/View Channels`, `Read Message History`, `Add Reactions`
6. Copy the generated URL, open it in a browser, and add the bot to your Discord server
7. Create a channel for captures (e.g., `#vault-inbox`) and copy its channel ID (right-click → Copy Channel ID; enable Developer Mode in Discord settings if needed)

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and paste your bot token and channel ID.

### 4. Start the container

```bash
docker compose up -d
```

### 5. Log into Claude Code

```bash
docker exec -it my-vault-vault-1 zsh
claude
```

On first run, Claude Code will prompt you to log in with your Pro account. This only needs to happen once — your auth persists across container restarts.

### 6. Open in Obsidian

Open the `vault/` directory as an Obsidian vault. That's where all the wiki content lives.

## Daily use

### Capturing content

- **Web articles**: Use Obsidian Web Clipper to save articles, then share the `.md` file to your Discord channel
- **Quick notes**: Type directly in the Discord channel
- **Images**: Post images to the Discord channel with optional caption

### Processing captures

Open a terminal in the container and start Claude:

```bash
docker exec -it my-vault-vault-1 zsh
claude
```

Then tell Claude what to do:

- **"process intake"** — batch-process everything the Discord bot has captured
- **"sweep"** — review today's daily page, promote wiki-worthy notes
- **"lint"** — health-check the wiki (orphan pages, broken links, stale content)
- **"what do I have on [topic]?"** — ask questions answered from your wiki
- **"ingest raw/articles/some-article.md"** — process a specific source in detail

### Reading the wiki

Open the `vault/` folder in Obsidian. Browse `wiki/` for organized content, `daily/` for chronological notes. Wikilinks (`[[like this]]`) connect everything.

## Directory layout

```
my-vault/
├── docker-compose.yml     # Container configuration
├── Dockerfile             # Container image definition
├── .env                   # Your Discord credentials (not committed)
├── bot/                   # Discord intake bot source
└── vault/                 # ← Open this in Obsidian
    ├── CLAUDE.md          # Vault operating schema (Claude reads this)
    ├── daily/             # One page per day
    ├── raw/               # Immutable source documents
    ├── wiki/              # Claude-maintained knowledge base
    │   ├── entities/      # People, organizations, tools
    │   ├── concepts/      # Ideas, patterns, topics
    │   ├── sources/       # Source summaries
    │   └── syntheses/     # Cross-cutting analyses
    ├── intake/            # Discord bot capture queue
    ├── index.md           # Content catalog
    └── log.md             # Operations log
```

## Updating

To update the bot or container:

```bash
docker compose down
git pull
docker compose up -d --build
```

Your vault content in `vault/` is untouched by updates.
