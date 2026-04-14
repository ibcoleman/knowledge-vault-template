FROM node:22-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI + pm2 + tsx
RUN npm install -g @anthropic-ai/claude-code pm2 tsx

# Bot setup
WORKDIR /app/bot
COPY bot/package.json bot/package-lock.json ./
RUN npm ci --omit=dev
COPY bot/ ./

# Ensure node user can write to bot logs and Claude auth directory
RUN mkdir -p /app/bot/logs /home/node/.claude \
    && chown -R node:node /app/bot /home/node/.claude

# Suppress zsh new-user prompt
RUN touch /home/node/.zshrc && chown node:node /home/node/.zshrc

WORKDIR /vault

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV HOME=/home/node

USER node
ENTRYPOINT ["/entrypoint.sh"]
