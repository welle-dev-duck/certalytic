import Redis from 'ioredis';

import { env } from '../config/env';
import { REALTIME_REDIS_CHANNEL, type RealtimeMessage } from './channels';
import type { RealtimeServer } from './ws.server';

export class RealtimeSubscriber {
  private readonly redis: Redis;

  constructor(private readonly realtimeServer: RealtimeServer) {
    this.redis = new Redis(env.REDIS_URL);
    this.redis.subscribe(REALTIME_REDIS_CHANNEL);
    this.redis.on('message', (_channel, raw) => {
      this.handleMessage(raw);
    });
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }

  private handleMessage(raw: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      !('organizationId' in parsed) ||
      typeof parsed.organizationId !== 'string'
    ) {
      return;
    }

    this.realtimeServer.broadcast(parsed as RealtimeMessage);
  }
}
