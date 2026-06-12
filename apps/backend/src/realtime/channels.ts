export const REALTIME_REDIS_CHANNEL = 'certalytic:realtime';

export type RealtimeMessage =
  | {
      type: 'candidate.updated';
      organizationId: string;
      payload: {
        candidateId: string;
        status: string;
        errorMessage: string | null;
      };
    }
  | {
      type: 'role_export.updated';
      organizationId: string;
      payload: {
        roleExportId: string;
        roleId: string;
        status: string;
        downloadUrl: string | null;
        errorMessage: string | null;
      };
    };
