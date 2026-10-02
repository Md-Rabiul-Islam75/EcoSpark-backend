import dotenv from 'dotenv';

dotenv.config();

const required = (name: string, value: string | undefined, fallback?: string) => {
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing environment variable: ${name}`);
};

const validateDatabaseUrl = (value: string | undefined) => {
  const databaseUrl = required('DATABASE_URL', value);

  try {
    const parsedUrl = new URL(databaseUrl);

    if (!parsedUrl.username || !parsedUrl.password) {
      throw new Error('DATABASE_URL must include both username and password');
    }

    if (!parsedUrl.hostname) {
      throw new Error('DATABASE_URL must include a host name');
    }

    return databaseUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid DATABASE_URL value';
    throw new Error(`Invalid DATABASE_URL: ${message}`);
  }
};

const normalizeOrigin = (value: string | undefined, fallback: string) =>
  (value || fallback).trim().replace(/\/+$/, '');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: normalizeOrigin(process.env.FRONTEND_URL, 'http://localhost:3000'),
  corsOrigin: normalizeOrigin(process.env.CORS_ORIGIN, 'http://localhost:3000'),
  databaseUrl: validateDatabaseUrl(process.env.DATABASE_URL),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripePriceId: process.env.STRIPE_PRICE_ID || '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
};
