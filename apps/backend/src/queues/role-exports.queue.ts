import { Queue, type ConnectionOptions } from 'bullmq';

import { roleExportsQueueDefaultJobOptions } from './role-exports.queue-options';

export const ROLE_EXPORTS_QUEUE_NAME = 'role-exports';

export function createRoleExportsQueue(connection: ConnectionOptions): Queue {
  return new Queue(ROLE_EXPORTS_QUEUE_NAME, {
    connection,
    defaultJobOptions: roleExportsQueueDefaultJobOptions,
  });
}
