import { readConfig } from './config.js';
import { connectDatabase } from './db.js';
import { createAdminAuth } from './auth.js';

let database;
try {
  const config = readConfig();
  if (!config.AUTH_SECRET) throw new Error('Configure AUTH_SECRET first.');
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password || password.length < 12) throw new Error('Provide ADMIN_BOOTSTRAP_PASSWORD (12+ characters) securely.');
  database = await connectDatabase(config);
  const existing = await database.db.collection('user').findOne({ email: config.ADMIN_EMAIL });
  if (existing) throw new Error('Admin already exists; this command will not overwrite its password.');
  const auth = createAdminAuth(database.db, config, { bootstrap: true });
  await auth.api.signUpEmail({ body: { email: config.ADMIN_EMAIL, password, name: 'Rythum Shastri' } });
  console.info('Admin created. Password is stored only as a hash.');
} catch (error) {
  console.error(['Configure AUTH_SECRET first.', 'Provide ADMIN_BOOTSTRAP_PASSWORD (12+ characters) securely.', 'Admin already exists; this command will not overwrite its password.'].includes(error.message) ? error.message : 'Admin setup failed. Check configuration and database connectivity.');
  process.exitCode = 1;
} finally {
  await database?.client.close();
}
