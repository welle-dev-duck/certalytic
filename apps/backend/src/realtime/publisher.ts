import type Redis from 'ioredis';

import { REALTIME_REDIS_CHANNEL, type RealtimeMessage } from './channels';

export type CandidateUpdatedEvent = {
  candidateId: string;
  organizationId: string;
  status: string;
  errorMessage?: string | null;
};

export type RoleExportUpdatedEvent = {
  roleExportId: string;
  roleId: string;
  organizationId: string;
  status: string;
  downloadUrl?: string | null;
  errorMessage?: string | null;
};

export interface RealtimePublisher {
  candidateUpdated(event: CandidateUpdatedEvent): Promise<void>;
  roleExportUpdated(event: RoleExportUpdatedEvent): Promise<void>;
}

export class NoopRealtimePublisher implements RealtimePublisher {
  async candidateUpdated(): Promise<void> {}

  async roleExportUpdated(): Promise<void> {}
}

export class RedisRealtimePublisher implements RealtimePublisher {
  constructor(private readonly redis: Redis) {}

  async candidateUpdated(event: CandidateUpdatedEvent): Promise<void> {
    await this.publish({
      type: 'candidate.updated',
      organizationId: event.organizationId,
      payload: {
        candidateId: event.candidateId,
        status: event.status,
        errorMessage: event.errorMessage ?? null,
      },
    });
  }

  async roleExportUpdated(event: RoleExportUpdatedEvent): Promise<void> {
    await this.publish({
      type: 'role_export.updated',
      organizationId: event.organizationId,
      payload: {
        roleExportId: event.roleExportId,
        roleId: event.roleId,
        status: event.status,
        downloadUrl: event.downloadUrl ?? null,
        errorMessage: event.errorMessage ?? null,
      },
    });
  }

  private async publish(message: RealtimeMessage): Promise<void> {
    await this.redis.publish(REALTIME_REDIS_CHANNEL, JSON.stringify(message));
  }
}
