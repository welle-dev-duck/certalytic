import type { ConnectionOptions, Queue } from 'bullmq';

import { createEmailsQueue } from './emails.queue';
import { createRolesQueue } from './roles.queue';
import { createScreeningQueue } from './screening.queue';

export class Queues {
  readonly emails: Queue;
  readonly roles: Queue;
  readonly screening: Queue;

  constructor(connection: ConnectionOptions) {
    this.emails = createEmailsQueue(connection);
    this.roles = createRolesQueue(connection);
    this.screening = createScreeningQueue(connection);
  }

  all(): Queue[] {
    return [this.emails, this.roles, this.screening];
  }

  async close(): Promise<void> {
    await Promise.all(this.all().map((queue) => queue.close()));
  }
}
