import { cleanEnv, str, port, num, url, email, bool, makeValidator } from 'envalid';
import { config } from 'dotenv';

// Load môi trường phù hợp dựa trên NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
config({ path: envFile });

// Custom validator cho string có độ dài tối thiểu
const str32 = makeValidator<string>(x => {
  if (typeof x !== 'string') {
    throw new Error('Expected string');
  }
  if (x.length < 32) {
    throw new Error('String must be at least 32 characters long');
  }
  return x;
});

export default function validateEnv() {
  return cleanEnv(process.env, {
    // Server
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    PORT: port({ default: 5000 }),
    FRONTEND_URL: url(),
    CORS_ORIGINS: str(),

    // Database
    DB_HOST: str(),
    DB_PORT: port({ default: 5432 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASS: str(),

    // JWT
    JWT_SECRET: str32(),
    REFRESH_TOKEN_SECRET: str32(),
    JWT_EXPIRES_IN: str(),
    JWT_REFRESH_EXPIRES_IN: str(),

    // Redis
    REDIS_HOST: str(),
    REDIS_PORT: port({ default: 6379 }),
    REDIS_PASSWORD: str({ default: '' }),
    REDIS_DB: num({ default: 0 }),
    REDIS_URL: url({ default: 'redis://localhost:6379' }),

    // Cloudflare R2
    R2_ACCOUNT_ID: str(),
    R2_ACCESS_KEY_ID: str(),
    R2_SECRET_ACCESS_KEY: str(),
    R2_BUCKET: str(),
    CLOUDFLARE_DOMAIN: str(),
    CLOUDFLARE_WORKER_DOMAIN: str(),

    // Media
    UPLOAD_PATH: str({ default: './uploads' }),
    MAX_UPLOAD_SIZE: num(),
    ALLOWED_FILE_TYPES: str(),
    HLS_SEGMENT_DURATION: num({ default: 6 }),

    // Security
    RATE_LIMIT_WINDOW: str({ default: '15m' }),
    RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
    RATE_LIMIT_WHITELIST: str({ default: '' }),

    // Worker
    WORKER_SECRET: str(),
    WORKER_CONCURRENCY: num({ default: 2 }),

    // Queue System
    HLS_QUEUE_CONCURRENCY: num({ default: 2 }),
    HLS_QUEUE_RETRY_ATTEMPTS: num({ default: 3 }),
    HLS_QUEUE_RETRY_DELAY: num({ default: 30000 }),
    QUEUE_DASHBOARD_ENABLED: bool({ default: true }),

    // Logging
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'debug'], default: 'info' }),
    LOG_FILE_PATH: str(),

    // Email
    SMTP_HOST: str(),
    SMTP_PORT: port({ default: 587 }),
    SMTP_USER: email(),
    SMTP_PASS: str(),

    // Optional Monitoring Configuration
    SENTRY_DSN: str({ default: undefined }),
    NEW_RELIC_LICENSE_KEY: str({ default: undefined }),
    DATADOG_API_KEY: str({ default: undefined }),

    // Optional Backup Configuration
    BACKUP_ENABLED: bool({ default: false }),
    BACKUP_CRON: str({ default: '0 0 * * *' }),
    BACKUP_RETENTION_DAYS: num({ default: 30 }),
    BACKUP_S3_BUCKET: str({ default: undefined }),

    // Optional Production Configuration
    PUBLIC_DOMAIN: str({ default: undefined }),
  });
}

// Kiểm tra và export các biến môi trường đã được validate
export const env = validateEnv(); 