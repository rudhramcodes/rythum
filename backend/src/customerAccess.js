import { createHash, randomBytes } from 'node:crypto';

export const tokenHash = value => createHash('sha256').update(value).digest('hex');
export async function customerLink(db, config, email) {
  const token = randomBytes(32).toString('hex');
  await db.collection('customerTokens').insertOne({ _id: tokenHash(token), email, expiresAt: new Date(Date.now() + 15 * 60000) });
  const url = new URL('/portal', config.origins[0]);
  url.hash = new URLSearchParams({ token }).toString();
  return url.href;
}

export async function customerSession(db, config, headers) {
  const name = config.NODE_ENV === 'production' ? '__Secure-customer-session' : 'customer-session';
  const token = (headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.collection('customerSessions').findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
}
