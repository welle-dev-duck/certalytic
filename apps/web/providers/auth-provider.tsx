"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import type { AuthSession, User } from "@/features/auth/types/session";
import type { OrganizationSummary } from "@/features/organizations/types";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
  user: User | null;
  organizations: OrganizationSummary[];
  activeOrganization: OrganizationSummary | null;
  switchOrganization: (organizationId: string) => Promise<void>;
  refetchOrganizations: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PREFIXES = ["/auth", "/legal"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function SessionLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="animate-pulse text-sm font-medium tracking-wide text-muted-foreground">
          Verifying session...
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const {
    data: organizationsData,
    isPending: isOrgsPending,
    refetch: refetchOrganizationsQuery,
  } = authClient.useListOrganizations();
  const organizations = organizationsData ?? [];

  const isAuthenticated = !!session;
  const isAuthPage = pathname.startsWith("/auth");
  const isPublic = isPublicPath(pathname);
  const isLoading =
    isSessionPending || (isAuthenticated && isOrgsPending && !isPublic);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      await authClient.organization.setActive({ organizationId });
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const refetchOrganizations = useCallback(() => {
    void refetchOrganizationsQuery();
  }, [refetchOrganizationsQuery]);

  const defaultOrgSelectionStarted = useRef(false);

  useEffect(() => {
    if (!session) {
      defaultOrgSelectionStarted.current = false;
    }
  }, [session]);

  useEffect(() => {
    if (isLoading || isSessionPending || isOrgsPending) return;
    if (!session?.user) return;
    if (session.session?.activeOrganizationId) return;
    if (organizations.length === 0) return;
    if (defaultOrgSelectionStarted.current) return;

    const defaultOrgId = organizations[0]?.id;
    if (!defaultOrgId) return;

    defaultOrgSelectionStarted.current = true;
    void switchOrganization(defaultOrgId).catch(() => {
      defaultOrgSelectionStarted.current = false;
    });
  }, [
    isLoading,
    isOrgsPending,
    isSessionPending,
    organizations,
    session,
    switchOrganization,
  ]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublic) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : pathname;
      const params = new URLSearchParams({ callbackURL: returnTo });
      router.replace(`${routes.signIn()}?${params.toString()}`);
      return;
    }

    if (isAuthenticated && isAuthPage) {
      router.replace(routes.dashboard());
    }
  }, [isAuthPage, isAuthenticated, isLoading, isPublic, router]);

  const activeOrganization = useMemo(() => {
    const activeOrgId = session?.session?.activeOrganizationId;
    if (!activeOrgId) return null;
    return organizations.find((org) => org.id === activeOrgId) ?? null;
  }, [organizations, session?.session?.activeOrganizationId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      session: session ?? null,
      user: session?.user ?? null,
      organizations,
      activeOrganization,
      switchOrganization,
      refetchOrganizations,
    }),
    [
      activeOrganization,
      isAuthenticated,
      isLoading,
      organizations,
      refetchOrganizations,
      session,
      switchOrganization,
    ],
  );

  if (isLoading && !isPublic) return <SessionLoader />;
  if (!isAuthenticated && !isPublic) return <SessionLoader />;
  if (isAuthenticated && isAuthPage) return <SessionLoader />;

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
