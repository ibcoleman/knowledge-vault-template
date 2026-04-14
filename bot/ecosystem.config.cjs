module.exports = {
  apps: [
    {
      name: 'discord-intake',
      script: './src/bot.ts',
      interpreter: './node_modules/.bin/tsx',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        VAULT_PATH: '/vault',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
