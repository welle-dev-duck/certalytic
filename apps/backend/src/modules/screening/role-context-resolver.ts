import { eq } from 'drizzle-orm';

import type { Database } from '../../db/index';
import { roles } from '../../db/schema/roles.schema';
import type { RoleContext } from './role-context';

type CandidateRoleSource = {
  roleId: string | null;
  roleTitle: string | null;
  jobDescription: string | null;
};

export class RoleContextResolver {
  constructor(private readonly db: Database) {}

  async resolve(candidate: CandidateRoleSource): Promise<RoleContext> {
    if (!candidate.roleId) {
      return {
        title: candidate.roleTitle,
        description: candidate.jobDescription,
        scanAssets: [],
      };
    }

    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, candidate.roleId),
      with: {
        documents: true,
      },
    });

    if (!role) {
      return {
        title: candidate.roleTitle,
        description: candidate.jobDescription,
        scanAssets: [],
      };
    }

    const scanAssets = role.documents
      .filter(
        (document) =>
          document.ocrStatus === 'complete' &&
          document.extractedText &&
          document.extractedText.trim() !== '',
      )
      .map((document) => ({
        name: document.originalName,
        text: document.extractedText!,
      }));

    return {
      title: role.title,
      description: role.description,
      contextMetadata: role.contextMetadata ?? null,
      scanAssets,
    };
  }
}
