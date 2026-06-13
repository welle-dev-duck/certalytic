import { logger } from '../../lib/logger';
import type { CandidateSensitiveDataService } from './candidate-sensitive-data.service';

const DAY_MS = 24 * 60 * 60 * 1000;

export class CandidateRetentionScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly candidateSensitiveDataService: CandidateSensitiveDataService,
  ) {}

  start(): void {
    void this.run();

    this.timer = setInterval(() => {
      void this.run();
    }, DAY_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async run(): Promise<void> {
    try {
      const count =
        await this.candidateSensitiveDataService.eraseExpiredFailedCandidates();

      if (count > 0) {
        logger.info(
          { count },
          'Erased sensitive data for expired failed candidates',
        );
      }
    } catch (error) {
      logger.error(
        { err: error },
        'Failed candidate retention cleanup run failed',
      );
    }
  }
}
