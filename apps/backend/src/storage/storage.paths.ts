import { v7 as uuidv7 } from 'uuid';

export function roleDocumentPath(
  organizationId: string,
  roleId: string,
  extension: string,
): string {
  const safeExtension = extension.toLowerCase().replace(/^\./, '');

  return `${organizationId}/roles/${roleId}/${uuidv7()}.${safeExtension}`;
}

export function roleExportPath(
  organizationId: string,
  roleId: string,
  exportId: string,
): string {
  return `${organizationId}/roles/${roleId}/exports/${exportId}.pdf`;
}

export function candidateCvPath(
  organizationId: string,
  candidateId: string,
  extension: string,
): string {
  const safeExtension = extension.toLowerCase().replace(/^\./, '');

  return `${organizationId}/candidates/${candidateId}/cv/${uuidv7()}.${safeExtension}`;
}
