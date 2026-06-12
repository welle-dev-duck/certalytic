import { Queue, type ConnectionOptions } from 'bullmq';

import { emailsQueueDefaultJobOptions } from './emails.queue-options';

export const EMAILS_QUEUE_NAME = 'emails';

export function createEmailsQueue(connection: ConnectionOptions): Queue {
  return new Queue(EMAILS_QUEUE_NAME, {
    connection,
    defaultJobOptions: emailsQueueDefaultJobOptions,
  });
}
