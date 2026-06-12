"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthSession } from "@/features/auth/types/session";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
};

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  session: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();
  const isAuthPage = pathname.startsWith("/auth");
  const isAuthenticated = !!session;

  useEffect(() => {
    // 1. Wait until we actually know the session status
    if (isPending) return;

    // 2. Guard Protected Pages: If not logged in, kick to sign-in
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/auth/sign-in");
      return;
    }

    // 3. Guard Auth Pages: If already logged in, kick to dashboard
    if (isAuthenticated && isAuthPage) {
      router.replace("/");
      return;
    }
  }, [isAuthPage, isPending, isAuthenticated, router]);

  // While checking auth status, show nothing (or a loading spinner)
  // This prevents layout flashes on BOTH protected pages AND auth pages
  if (isPending) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  // Enforce route safety during render to completely stop content flashes
  if (!isAuthenticated && !isAuthPage)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Modern clean ring spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );
  if (isAuthenticated && isAuthPage)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Modern clean ring spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-wide">
            Verifying session...
          </p>
        </div>
      </div>
    );

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading: false, session }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
