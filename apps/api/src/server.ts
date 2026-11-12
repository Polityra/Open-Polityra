async function startServer(): Promise<void> {
  const [{ createApp }, { getEnv }, { closePool }] = await Promise.all([
    import("./app"),
    import("./config/env"),
    import("./config/database"),
    import("./app"),
    import("./config/env"),
    import("./config/database"),
  ]);

  const app = createApp();
  const cfg = getEnv();
  const { startNewsScraper } = await import("./modules/news/scraper");
  const { startAutomaticAnalyses } = await import("./modules/analyses/automatic");
  const stopNewsScraper = startNewsScraper();
  const stopAutomaticAnalyses = startAutomaticAnalyses();
  const server = app.listen(cfg.PORT, () => {
    console.log(`Open Polityra API listening on port ${cfg.PORT}`);
  });

  function gracefulShutdown(signal: string) {
    console.log(`\n${signal} received. Shutting down...`);
    stopNewsScraper();
    stopAutomaticAnalyses();
    server.close(async () => {
      await closePool();
      console.log("Database connection pool closed.");
      console.log("Database connection pool closed.");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Could not close connections in time. Forcing exit.");
      console.error("Could not close connections in time. Forcing exit.");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

void startServer().catch((err: unknown) => {
  console.error("Failed to start API server:", err);
  console.error("Failed to start API server:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});
