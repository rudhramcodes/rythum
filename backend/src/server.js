import { readConfig } from './config.js';
import { connectDatabase } from './db.js';
import { createApp } from './app.js';

let database;
try {
  const config = readConfig();
  database = await connectDatabase(config);
  const app = createApp({ ...database, config });
  const server = app.listen(config.PORT, config.HOST, () => console.info(`API listening on port ${config.PORT}; SMTP worker runs separately.`));
  server.on('error', async () => {
    console.error('API failed to listen. Check HOST and PORT.');
    await database.client.close();
    process.exitCode = 1;
  });
  let closing = false;
  const stop = () => {
    if (closing) return;
    closing = true;
    const deadline = setTimeout(() => process.exit(1), 15000);
    deadline.unref();
    server.close(async () => {
      await database.client.close();
      clearTimeout(deadline);
    });
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
} catch (error) {
  // Configuration errors name only settings; database errors can contain secrets.
  console.error(database ? 'API startup failed.' : 'Startup failed. Check environment configuration and MongoDB connectivity.');
  console.error(`Error type: ${error.name}`);
  await database?.client.close();
  process.exitCode = 1;
}
