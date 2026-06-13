import { describe, expect, it, vi } from 'vitest';

import { logger } from '../../lib/logger';
import { createResendMailer } from './resend-mailer';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}));

describe('createResendMailer', () => {
  it('logs a stub delivery when Resend is not configured', async () => {
    const log = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const mailer = createResendMailer();

    expect(mailer.isConfigured()).toBe(false);

    await mailer.send({
      to: 'user@example.com',
      subject: 'Test email',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(log).toHaveBeenCalledWith(
      {
        to: 'user@example.com',
        subject: 'Test email',
        tags: undefined,
      },
      'Email delivery stub (Resend not configured)',
    );

    log.mockRestore();
  });
});
