import path from 'path';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Meilisearch
  searchUrl: process.env.SEARCH_URL || 'http://localhost:7700',
  meiliMasterKey: process.env.MEILI_MASTER_KEY || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Upload
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Google Cloud Vision
  googleVision: {
    enabled: process.env.GOOGLE_CLOUD_VISION_ENABLED === 'true',
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
    monthlyLimit: parseInt(process.env.GOOGLE_VISION_MONTHLY_LIMIT || '1000', 10),
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
} as const;

// Fail fast if JWT_SECRET is not set in production
if (config.isProduction && config.jwt.secret === 'dev-secret-change-in-production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

export default config;
