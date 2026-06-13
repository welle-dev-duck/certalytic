import type Redis from 'ioredis';
import type { Pool } from 'pg';

import type { HealthCheckResult, HealthResponseDto } from '../../dtos/common.dto';
import { HEALTH_CHECK_TIMEOUT_MS, withTimeout } from '../../lib/timeout';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Check failed';
}

async function measureCheck(
  label: string,
  run: () => Promise<void>,
): Promise<HealthCheckResult> {
  const startedAt = Date.now();

  try {
    await withTimeout(run(), HEALTH_CHECK_TIMEOUT_MS, label);

    return {
      status: 'ok',
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      message: errorMessage(error),
    };
  }
}

export class HealthService {
  constructor(
    private readonly pool: Pool,
    private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthResponseDto> {
    const [database, redis] = await Promise.all([
      measureCheck('database', async () => {
        await this.pool.query('SELECT 1');
      }),
      measureCheck('redis', async () => {
        const response = await this.redis.ping();

        if (response !== 'PONG') {
          throw new Error(`Unexpected Redis ping response: ${response}`);
        }
      }),
    ]);

    const status =
      database.status === 'ok' && redis.status === 'ok' ? 'ok' : 'error';

    return {
      status,
      checks: {
        database,
        redis,
      },
    };
  }
}
