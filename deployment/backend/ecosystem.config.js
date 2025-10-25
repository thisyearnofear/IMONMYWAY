module.exports = {
  apps: [{
    name: 'imonmyway-backend',
    script: 'backend-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://imonmyway:password@localhost:5432/imonmyway_prod'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};