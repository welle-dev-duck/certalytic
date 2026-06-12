import { Queue, type ConnectionOptions } from 'bullmq';

import { screeningQueueDefaultJobOptions } from './screening.queue-options';

export const SCREENING_QUEUE_NAME = 'screening';

export function createScreeningQueue(connection: ConnectionOptions): Queue {
  return new Queue(SCREENING_QUEUE_NAME, {
    connection,
    defaultJobOptions: screeningQueueDefaultJobOptions,
  });
}
