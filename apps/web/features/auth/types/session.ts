import { authClient } from "@/lib/auth-client";

export type AuthSession = typeof authClient.$Infer.Session;

export type Session = typeof authClient.$Infer.Session.session & {
  activeOrganizationId: string | null;
  impersonatedBy: string | null;
};

export type User = typeof authClient.$Infer.Session.user;
