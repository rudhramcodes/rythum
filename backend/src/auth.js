import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { APIError } from 'better-auth/api';
import { createMailTransport } from './notifications.js';

export function createAdminAuth(db, config, { bootstrap = false, resetTransport } = {}) {
  if (!config.AUTH_SECRET) return null;
  return betterAuth({
    appName: 'Rythum Shastri',
    secret: config.AUTH_SECRET,
    baseURL: config.AUTH_BASE_URL,
    basePath: '/api/auth',
    database: mongodbAdapter(db),
    trustedOrigins: config.origins,
    emailAndPassword: { enabled: true, disableSignUp: !bootstrap, minPasswordLength: 12,
      resetPasswordTokenExpiresIn: 900,
      revokeSessionsOnPasswordReset: true,
      ...(config.SMTP_ENABLED === 'true' ? { sendResetPassword: async ({ user, token }) => {
        if (user.email.toLowerCase() !== config.ADMIN_EMAIL) return;
        const url = new URL('/admin', config.origins[0]);
        url.hash = new URLSearchParams({ reset: token }).toString();
        const result = await (resetTransport || createMailTransport(config)).sendMail({
          from: { name: 'Rythum Shastri', address: config.MAIL_FROM },
          to: user.email,
          subject: 'Reset your workspace password',
          text: `Reset your Rythum Shastri workspace password:\n\n${url.href}\n\nThis link expires in 15 minutes and works once. If you did not request this, ignore this email.`,
        });
        if (!result.accepted?.length) throw new Error('Reset email was not accepted.');
      } } : {}),
    },
    session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30 },
    advanced: { useSecureCookies: config.NODE_ENV === 'production', defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' } },
    logger: { disabled: true },
    databaseHooks: {
      user: { create: { before: async user => {
        if (user.email.toLowerCase() !== config.ADMIN_EMAIL) throw new APIError('FORBIDDEN', { message: 'Admin access is restricted.' });
        return { data: { ...user, email: user.email.toLowerCase() } };
      } } },
    },
  });
}

export async function prepareAuthIndexes(db) {
  await Promise.all([
    db.collection('user').createIndex({ email: 1 }, { unique: true }),
    db.collection('session').createIndex({ token: 1 }, { unique: true }),
    db.collection('session').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('account').createIndex({ providerId: 1, accountId: 1 }, { unique: true }),
    db.collection('verification').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
