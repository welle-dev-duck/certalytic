export type CandidateUpdatedEvent = {
  type: "candidate.updated";
  organizationId: string;
  payload: {
    candidateId: string;
    status: string;
    errorMessage: string | null;
  };
};

export type RoleExportUpdatedEvent = {
  type: "role_export.updated";
  organizationId: string;
  payload: {
    roleExportId: string;
    roleId: string;
    status: string;
    downloadUrl: string | null;
    errorMessage: string | null;
  };
};

export type RealtimeServerMessage =
  | { type: "connected" }
  | { type: "subscribed"; organizationId: string }
  | { type: "error"; message: string }
  | CandidateUpdatedEvent
  | RoleExportUpdatedEvent;

export function getRealtimeWebSocketUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const parsed = new URL(apiUrl);
  const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${parsed.host}/api/realtime`;
}
