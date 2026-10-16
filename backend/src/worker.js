import { setTimeout as delay } from 'node:timers/promises';
import { readConfig } from './config.js';
import { connectDatabase } from './db.js';
import { createMailTransport, deliverNextJob, queueNotifications } from './notifications.js';

let database;
let transport;
try {
  const config = readConfig();
  if (config.SMTP_ENABLED !== 'true') {
    console.info('SMTP is disabled. Saved notification jobs remain pending.');
  } else {
    database = await connectDatabase(config);
    transport = createMailTransport(config);
    let stopping = false;
    const stop = () => { stopping = true; };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    console.info('Notification worker started.');
    while (!stopping) {
      try {
        await queueNotifications(database.db);
        if (!await deliverNextJob(database.db, transport, config)) await delay(2000);
      } catch {
        console.error('Notification worker iteration failed. Check database connectivity; in-flight jobs will require review.');
        await delay(5000);
      }
    }
  }
} catch {
  console.error('Worker startup failed. Check database and SMTP configuration.');
  process.exitCode = 1;
} finally {
  transport?.close();
  await database?.client.close();
}
