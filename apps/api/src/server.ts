import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../../../.env') });

async function startServer(): Promise<void> {
  const [{ createApp }, { getEnv }, { closePool }, { startNewsScraper }] = await Promise.all([
    import('./app'),
    import('./config/env'),
    import('./config/database'),
    import('./modules/news/scraper'),
  ]);

  const app = createApp();
  const cfg = getEnv();
  const stopNewsScraper = startNewsScraper();
  const server = app.listen(cfg.PORT, () => {
    console.log(`Open Polityra API listening on port ${cfg.PORT}`);
  });

  function gracefulShutdown(signal: string) {
    console.log(`\n${signal} received. Shutting down...`);
    stopNewsScraper();
    server.close(async () => {
      await closePool();
      console.log('Database connection pool closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Could not close connections in time. Forcing exit.');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

void startServer().catch((err: unknown) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
