#!/bin/sh

# Start the Discord intake bot in the background
cd /app/bot
pm2 start ecosystem.config.cjs --no-daemon &
BOT_PID=$!

# Keep the container alive for interactive use
# User connects via: docker exec -it <container> zsh
wait $BOT_PID
