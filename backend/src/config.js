import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('127.0.0.1'),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  MONGODB_DB: z.string().regex(/^[a-zA-Z0-9_-]{1,63}$/),
  WEB_ORIGINS: z.string().min(1),
  TRUST_PROXY: z.string().default(''),
  SMTP_ENABLED: z.enum(['true', 'false']).default('false'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().pipe(z.union([z.literal(465), z.literal(587)])).default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default(''),
  MAIL_REPLY_TO: z.string().default(''),
  TEAM_EMAILS: z.string().default(''),
  ADMIN_EMAIL: z.email().transform(value => value.toLowerCase()).default('notyourshastri@gmail.com'),
  AUTH_SECRET: z.string().default(''),
  AUTH_BASE_URL: z.string().default('http://localhost:4000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
});

export function readConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) throw new Error(`Invalid configuration: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const config = parsed.data;
  if (config.AUTH_SECRET && config.AUTH_SECRET.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters.');
  let authUrl;
  try { authUrl = new URL(config.AUTH_BASE_URL); } catch { throw new Error('Invalid AUTH_BASE_URL.'); }
  if (authUrl.origin !== config.AUTH_BASE_URL || !['https:', 'http:'].includes(authUrl.protocol) ||
    (config.AUTH_SECRET && config.NODE_ENV === 'production' && authUrl.protocol !== 'https:')) {
    throw new Error('AUTH_BASE_URL must be an exact origin (HTTPS in production).');
  }
  if (Boolean(config.GOOGLE_CLIENT_ID) !== Boolean(config.GOOGLE_CLIENT_SECRET)) throw new Error('Set both Google OAuth credentials.');
  config.origins = config.WEB_ORIGINS.split(',').map(v => v.trim());
  for (const origin of config.origins) {
    let url;
    try { url = new URL(origin); } catch { throw new Error('WEB_ORIGINS must contain exact HTTP(S) origins.'); }
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) ||
      (config.NODE_ENV === 'production' && url.protocol !== 'https:')) {
      throw new Error('WEB_ORIGINS must contain exact origins (HTTPS in production).');
    }
  }
  if (['true', 'false', '*'].includes(config.TRUST_PROXY) || /^\d+$/.test(config.TRUST_PROXY)) {
    throw new Error('TRUST_PROXY must be a trusted proxy IP/subnet, not a blanket trust flag or hop count.');
  }
  config.teamEmails = config.TEAM_EMAILS.split(',').map(v => v.trim()).filter(Boolean);
  if (config.teamEmails.some(v => !z.email().safeParse(v).success)) throw new Error('Invalid TEAM_EMAILS.');
  if (config.SMTP_ENABLED === 'true' && (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS ||
    !z.email().safeParse(config.MAIL_FROM).success || !z.email().safeParse(config.MAIL_REPLY_TO).success)) {
    throw new Error('SMTP is enabled; complete SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM and MAIL_REPLY_TO.');
  }
  return config;
}
