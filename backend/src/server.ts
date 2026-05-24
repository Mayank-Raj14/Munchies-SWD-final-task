import { app } from './app.js';
import { env } from './config/env.js';
import { startBackgroundJobs } from './jobs/scheduler.js';
import { prisma } from './prisma/client.js';

const server = app.listen(env.PORT, () => {
  console.log(`Munchies API listening on port ${env.PORT}`);
  startBackgroundJobs();
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
