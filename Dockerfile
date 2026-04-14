FROM node:22-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# pm2 for bot process management, tsx for TypeScript execution
RUN npm install -g pm2 tsx

# Bot setup
WORKDIR /app/bot
COPY bot/package.json bot/package-lock.json ./
RUN npm ci --omit=dev
COPY bot/ ./

# Vault is mounted at runtime, not baked in
VOLUME /vault

# Claude auth persists across container restarts
VOLUME /home/node/.claude

WORKDIR /vault

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node
ENTRYPOINT ["/entrypoint.sh"]
