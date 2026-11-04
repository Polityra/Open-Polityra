import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const [{ createApp }, { getEnv }, { closePool }] = await Promise.all([
  import('./app'),
  import('./config/env'),
  import('./config/database'),
]);

const app = createApp();
const cfg = getEnv();

const server = app.listen(cfg.PORT, () => {
  console.log(`Open Polityra API listening on port ${cfg.PORT}`);
});

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await closePool();
    console.log('Database connection pool closed.');
    process.exit(0);
  });

  // Force shutdown after 10s
  setTimeout(() => {
    console.error('Could not close connections in time. Forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

export default app;
