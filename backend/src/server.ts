import { app } from './app.js';
import { env } from './config/env.js';
import { startBackgroundJobs } from './jobs/scheduler.js';
import { prisma } from './prisma/client.js';
import { bootstrapPlatformAdminRole } from './services/auth.service.js';

const startServer = async () => {
  // Prisma connectivity / client readiness (keeps Docker startup deterministic + logs clarity)
  try {
    await prisma.$connect();
    console.log('Prisma client ready');
  } catch (err) {
    console.error('Failed to connect Prisma client', err);
    throw err;
  }

  await bootstrapPlatformAdminRole();

  // Ensure default hostels exist even if background-job startup changes.
  // Logs are handled inside ensureDefaultHostels().
  const { ensureDefaultHostels } = await import('./services/hostel.service.js');
  await ensureDefaultHostels();


  const server = app.listen(env.PORT, () => {
    console.log(`Munchies API listening on port ${env.PORT}`);
    startBackgroundJobs();
  });

  let shuttingDown = false;
  const shutdown = async (code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(code);
    });

    setTimeout(() => process.exit(code), 10000).unref();
  };

  process.on('SIGINT', () => void shutdown(0));
  process.on('SIGTERM', () => void shutdown(0));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection', reason);
    void shutdown(1);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception', error);
    void shutdown(1);
  });
};

void startServer().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});
