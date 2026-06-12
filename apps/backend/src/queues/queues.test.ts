import { describe, expect, it, vi } from 'vitest';

import { createEmailsQueue } from './emails.queue';
import { Queues } from './queues';

vi.mock('./emails.queue', () => ({
  createEmailsQueue: vi.fn(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Queues', () => {
  it('registers the emails queue', () => {
    const queues = new Queues({ url: 'redis://localhost:6379' });

    expect(createEmailsQueue).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(queues.all()).toEqual([queues.emails]);
  });

  it('closes all queues', async () => {
    const queues = new Queues({ url: 'redis://localhost:6379' });

    await queues.close();

    expect(queues.emails.close).toHaveBeenCalled();
  });
});
