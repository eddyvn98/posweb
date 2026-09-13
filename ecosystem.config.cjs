module.exports = {
  apps: [
    {
      name: 'posweb-free-backend',
      script: './bot_backend/server.js',
      cwd: 'd:/posweb-free',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
        DB_PROVIDER: 'sqlite',
        MONGO_URI: 'mongodb://127.0.0.1:27017',
        MONGO_DB_NAME: 'posweb_main',
        POSTGRES_URL: 'postgres://postgres:postgres@127.0.0.1:5432/posweb',
        POSTGRES_SSL: 'false',
        POSTGRES_POOL_MAX: '10',
        POSTGRES_CONNECT_TIMEOUT_MS: '5000',
        POSTGRES_IDLE_TIMEOUT_MS: '30000',
      },
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'posweb-free-frontend',
      script: './serve_frontend.cjs',
      cwd: 'd:/posweb-free',
      watch: false,
      max_memory_restart: '150M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
