module.exports = {
  apps: [
    {
      name: 'open-fanfare-backend',
      script: './dist/server.js',
      cwd: '/var/www/open_fanfare/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
