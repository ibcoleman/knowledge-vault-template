FROM node:22-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# pm2 for bot process management, tsx for TypeScript execution
RUN npm install -g pm2 tsx

# Bot setup
WORKDIR /app/bot
COPY bot/package.json bot/package-lock.json ./
RUN npm ci --omit=dev
COPY bot/ ./

# Ensure node user can write logs and Claude auth directory
RUN mkdir -p /app/bot/logs /home/node/.claude /home/node/.local/bin \
    && chown -R node:node /app/bot /home/node/.claude /home/node/.local

# Claude Code CLI (native binary — required for Pro subscription login)
# Must run as node user with HOME set so installer finds the right target
USER node
ENV HOME=/home/node
RUN curl -fsSL https://claude.ai/install.sh | sh \
    && ls -la /home/node/.local/bin/claude || echo "WARN: claude binary not found after install"
USER root

WORKDIR /vault

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ensure claude binary is on PATH for interactive sessions
ENV PATH="/home/node/.local/bin:${PATH}"

USER node
ENTRYPOINT ["/entrypoint.sh"]
