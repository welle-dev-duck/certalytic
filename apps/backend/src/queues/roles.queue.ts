import { Queue, type ConnectionOptions } from 'bullmq';

import { rolesQueueDefaultJobOptions } from './roles.queue-options';

export const ROLES_QUEUE_NAME = 'roles';

export function createRolesQueue(connection: ConnectionOptions): Queue {
  return new Queue(ROLES_QUEUE_NAME, {
    connection,
    defaultJobOptions: rolesQueueDefaultJobOptions,
  });
}
