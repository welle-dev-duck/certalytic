import type { ConnectionOptions, Queue } from 'bullmq';

import { createEmailsQueue } from './emails.queue';

export class Queues {
  readonly emails: Queue;

  constructor(connection: ConnectionOptions) {
    this.emails = createEmailsQueue(connection);
  }

  all(): Queue[] {
    return [this.emails];
  }

  async close(): Promise<void> {
    await Promise.all(this.all().map((queue) => queue.close()));
  }
}
