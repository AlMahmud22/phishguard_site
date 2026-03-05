// PM2 Ecosystem Config — PhishGuard
// Usage: pm2 start pm2.config.js
export default {
  apps: [
    {
      name: 'phishguard',
      script: 'node_modules/.bin/next',
      args: 'start -p 3005',
      cwd: '/var/www/html/mahmud/phishguard_web',

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
      },

      // Resource limits for 2GB droplet
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=384',

      // Logging
      out_file: '/var/log/phishguard/out.log',
      error_file: '/var/log/phishguard/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Reliability
      instances: 1,        // single-core droplet
      exec_mode: 'fork',   // fork is lighter than cluster for 1 instance
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
