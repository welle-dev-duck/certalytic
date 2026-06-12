import { Worker, type ConnectionOptions, type Processor } from 'bullmq';

export function createQueueWorker(
  queueName: string,
  processor: Processor,
  connection: ConnectionOptions,
  concurrency: number,
): Worker {
  return new Worker(queueName, processor, { connection, concurrency });
}
