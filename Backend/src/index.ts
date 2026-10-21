import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { runTicker } from './services/ticker.service.js';

async function main() {
  await connectDb();
  const app = createApp();
  // Runs on boot and thereafter; each DB update is conditional so overlapping instances remain safe.
  await runTicker();
  setInterval(() => void runTicker().catch((err) => console.error('Ticker failed:', err)), 30_000).unref();
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
