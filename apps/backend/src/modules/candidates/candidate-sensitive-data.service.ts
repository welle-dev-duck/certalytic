import { and, eq, inArray, lt } from 'drizzle-orm';

import type { Database } from '../../db/index';
import {
  candidates,
  interviewRounds,
} from '../../db/schema/candidates.schema';
import { roleDocuments, roleExports, roles } from '../../db/schema/roles.schema';
import { logger } from '../../lib/logger';
import type { StorageClient } from '../../storage/storage.client';

export const FAILED_CANDIDATE_RETENTION_DAYS = 30;

type CandidateRow = {
  id: string;
  organizationId: string;
  cvPath: string | null;
};

export class CandidateSensitiveDataService {
  constructor(
    private readonly db: Database,
    private readonly storage: StorageClient,
  ) {}

  async eraseCandidateSensitiveData(
    candidateId: string,
    organizationId?: string,
  ): Promise<void> {
    const candidate = await this.db.query.candidates.findFirst({
      where: organizationId
        ? and(
            eq(candidates.id, candidateId),
            eq(candidates.organizationId, organizationId),
          )
        : eq(candidates.id, candidateId),
      columns: {
        id: true,
        organizationId: true,
        cvPath: true,
      },
    });

    if (!candidate) {
      return;
    }

    if (candidate.cvPath) {
      await this.deleteStoredObject(candidate.cvPath);
    }

    await this.db
      .update(candidates)
      .set({
        cvPath: null,
        cvText: '',
        cvFormat: null,
        linkedinUrl: null,
        linkedinText: '',
        githubUsername: null,
        githubText: '',
        cvAnalysisResults: null,
      })
      .where(eq(candidates.id, candidate.id));

    await this.db
      .update(interviewRounds)
      .set({
        transcriptText: '',
        interviewerNotes: null,
      })
      .where(eq(interviewRounds.candidateId, candidate.id));
  }

  async deleteCandidateCompletely(
    candidateId: string,
    organizationId: string,
  ): Promise<void> {
    const candidate = await this.db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, organizationId),
      ),
      columns: {
        id: true,
        cvPath: true,
      },
    });

    if (!candidate) {
      return;
    }

    if (candidate.cvPath) {
      await this.deleteStoredObject(candidate.cvPath);
    }

    await this.db
      .delete(candidates)
      .where(
        and(
          eq(candidates.id, candidateId),
          eq(candidates.organizationId, organizationId),
        ),
      );
  }

  async deleteCandidatesForRole(
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({
        id: candidates.id,
        cvPath: candidates.cvPath,
      })
      .from(candidates)
      .where(
        and(
          eq(candidates.organizationId, organizationId),
          eq(candidates.roleId, roleId),
        ),
      );

    await Promise.all(
      rows
        .filter((row) => row.cvPath)
        .map((row) => this.deleteStoredObject(row.cvPath!)),
    );

    if (rows.length === 0) {
      return;
    }

    await this.db.delete(candidates).where(
      inArray(
        candidates.id,
        rows.map((row) => row.id),
      ),
    );
  }

  async eraseOrganizationCandidateStorage(
    organizationId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({
        id: candidates.id,
        cvPath: candidates.cvPath,
      })
      .from(candidates)
      .where(eq(candidates.organizationId, organizationId));

    await Promise.all(
      rows
        .filter((row) => row.cvPath)
        .map((row) => this.deleteStoredObject(row.cvPath!)),
    );
  }

  async wipeOrganizationStorage(organizationId: string): Promise<void> {
    await this.eraseOrganizationCandidateStorage(organizationId);

    const documents = await this.db
      .select({ path: roleDocuments.path })
      .from(roleDocuments)
      .innerJoin(roles, eq(roleDocuments.roleId, roles.id))
      .where(eq(roles.organizationId, organizationId));

    const exports = await this.db
      .select({ path: roleExports.path })
      .from(roleExports)
      .where(eq(roleExports.organizationId, organizationId));

    await Promise.all([
      ...documents.map((document) => this.deleteStoredObject(document.path)),
      ...exports
        .filter((entry) => entry.path)
        .map((entry) => this.deleteStoredObject(entry.path!)),
    ]);
  }

  async eraseExpiredFailedCandidates(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - FAILED_CANDIDATE_RETENTION_DAYS);

    const expired = await this.db
      .select({
        id: candidates.id,
        organizationId: candidates.organizationId,
        cvPath: candidates.cvPath,
      })
      .from(candidates)
      .where(
        and(
          eq(candidates.status, 'failed'),
          lt(candidates.failedAt, cutoff),
        ),
      );

    for (const candidate of expired) {
      await this.eraseCandidateSensitiveData(
        candidate.id,
        candidate.organizationId,
      );
    }

    return expired.length;
  }

  isRetryExpired(failedAt: Date | null | undefined): boolean {
    if (!failedAt) {
      return false;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - FAILED_CANDIDATE_RETENTION_DAYS);

    return failedAt < cutoff;
  }

  private async deleteStoredObject(key: string): Promise<void> {
    try {
      await this.storage.deleteObject(key);
    } catch (error) {
      logger.warn({ err: error, key }, 'Best-effort storage cleanup failed');
    }
  }
}
