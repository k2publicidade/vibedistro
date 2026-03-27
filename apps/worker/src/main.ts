import { Worker, Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@vibedistro/database';
import { createRevelatorConfig, RevelatorAuthClient, RevelatorProvider } from '@vibedistro/integrations/revelator';
import { syncReleaseProcessor } from './processors/sync-release.processor.js';
import { webhookProcessor } from './processors/webhook.processor.js';
import { analyticsProcessor } from './processors/analytics.processor.js';

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Provider setup
const config = createRevelatorConfig(process.env);
const authClient = new RevelatorAuthClient(config);
const provider = new RevelatorProvider(config, authClient);

// Queues
export const syncReleaseQueue = new Queue('sync-release', { connection });
export const webhookQueue = new Queue('webhook-process', { connection });
export const analyticsQueue = new Queue('analytics-ingest', { connection });

const syncConcurrency = Number(process.env['WORKER_SYNC_CONCURRENCY'] ?? 5);
const webhookConcurrency = Number(process.env['WORKER_WEBHOOK_CONCURRENCY'] ?? 10);
const analyticsConcurrency = Number(process.env['WORKER_ANALYTICS_CONCURRENCY'] ?? 3);

// Workers
const syncReleaseWorker = new Worker(
  'sync-release',
  (job) => syncReleaseProcessor(job, prisma, provider),
  { connection, concurrency: syncConcurrency },
);

const webhookWorker = new Worker(
  'webhook-process',
  (job) => webhookProcessor(job, prisma, provider),
  { connection, concurrency: webhookConcurrency },
);

const analyticsWorker = new Worker(
  'analytics-ingest',
  (job) => analyticsProcessor(job, prisma, provider),
  { connection, concurrency: analyticsConcurrency },
);

// Error handling
for (const worker of [syncReleaseWorker, webhookWorker, analyticsWorker]) {
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down workers...');
  await Promise.all([
    syncReleaseWorker.close(),
    webhookWorker.close(),
    analyticsWorker.close(),
  ]);
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`Worker started — Provider: revelator/${config.environment}, enabled=${config.enabled}`);
