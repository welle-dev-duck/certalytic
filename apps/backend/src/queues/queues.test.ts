import { describe, expect, it, vi } from 'vitest';

import { createBillingRefundQueue } from './billing-refund.queue';
import { createEmailsQueue } from './emails.queue';
import { createRolesQueue } from './roles.queue';
import { createScreeningQueue } from './screening.queue';
import { Queues } from './queues';

vi.mock('./emails.queue', () => ({
  createEmailsQueue: vi.fn(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./roles.queue', () => ({
  createRolesQueue: vi.fn(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./screening.queue', () => ({
  createScreeningQueue: vi.fn(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./billing-refund.queue', () => ({
  createBillingRefundQueue: vi.fn(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('Queues', () => {
  it('registers the emails, roles, screening, and billing-refund queues', () => {
    const queues = new Queues({ url: 'redis://localhost:6379' });

    expect(createEmailsQueue).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(createRolesQueue).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(createScreeningQueue).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(createBillingRefundQueue).toHaveBeenCalledWith({
      url: 'redis://localhost:6379',
    });
    expect(queues.all()).toEqual([
      queues.emails,
      queues.roles,
      queues.screening,
      queues.billingRefunds,
    ]);
  });

  it('closes all queues', async () => {
    const queues = new Queues({ url: 'redis://localhost:6379' });

    await queues.close();

    expect(queues.emails.close).toHaveBeenCalled();
    expect(queues.roles.close).toHaveBeenCalled();
    expect(queues.screening.close).toHaveBeenCalled();
    expect(queues.billingRefunds.close).toHaveBeenCalled();
  });
});
