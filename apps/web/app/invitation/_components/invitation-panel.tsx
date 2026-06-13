"use client";

import { Building2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppLogoIcon } from "@/components/brand/app-logo-icon";
import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { useTranslations } from "@/lib/i18n/client";
import { useAuth } from "@/providers/auth-provider";

type InvitationDetails = {
  id: string;
  email: string;
  role: string;
  status: string;
  organizationId: string;
  organizationName?: string;
  organization?: { name?: string };
};

export function InvitationPanel() {
  const t = useTranslations("app");
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const { user, isLoading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!invitationId || authLoading) return;

    let cancelled = false;

    async function loadInvitation() {
      setIsLoading(true);

      const result = await authClient.organization.getInvitation({
        query: { id: invitationId! },
      });

      if (cancelled) return;

      if (result.error || !result.data) {
        toast.error(result.error?.message ?? t("invitation.toast.notFound"));
        setInvitation(null);
        setIsLoading(false);
        return;
      }

      setInvitation(result.data as InvitationDetails);
      setIsLoading(false);
    }

    void loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [authLoading, invitationId]);

  async function handleAccept() {
    if (!invitationId || !invitation) return;

    setIsAccepting(true);

    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });

    if (result.error) {
      toast.error(result.error.message ?? t("invitation.toast.acceptFailed"));
      setIsAccepting(false);
      return;
    }

    if (invitation.organizationId) {
      await authClient.organization.setActive({
        organizationId: invitation.organizationId,
      });
    }

    toast.success(t("invitation.toast.accepted"));
    window.location.href = routes.dashboard();
  }

  async function handleReject() {
    if (!invitationId) return;

    setIsRejecting(true);

    const result = await authClient.organization.rejectInvitation({
      invitationId,
    });

    if (result.error) {
      toast.error(result.error.message ?? t("invitation.toast.rejectFailed"));
      setIsRejecting(false);
      return;
    }

    toast.success(t("invitation.toast.declined"));
    router.replace(routes.dashboard());
  }

  const organizationName =
    invitation?.organizationName ??
    invitation?.organization?.name ??
    t("invitation.defaultOrganization");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/30 bg-primary/15">
          <ShieldCheck size={14} className="text-primary" />
        </div>
        <p className="text-sm font-bold tracking-tight text-foreground">
          Certalytic
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="surface-panel w-full max-w-md space-y-6 rounded-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {t("invitation.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isLoading
                ? t("invitation.loading")
                : invitation
                  ? t("invitation.invited", {
                      organization: organizationName,
                      role: invitation.role,
                    })
                  : t("invitation.invalid")}
            </p>
            {user?.email && invitation?.email && user.email !== invitation.email ? (
              <p className="mt-2 text-xs text-destructive">
                {t("invitation.emailMismatch", {
                  signedInEmail: user.email,
                  invitationEmail: invitation.email,
                })}
              </p>
            ) : null}
          </div>

          {invitation && !isLoading ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="h-12 flex-1"
                disabled={isAccepting || isRejecting}
                onClick={() => void handleAccept()}
              >
                <LoadingSwap isLoading={isAccepting}>
                  {t("invitation.accept")}
                </LoadingSwap>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1"
                disabled={isAccepting || isRejecting}
                onClick={() => void handleReject()}
              >
                <LoadingSwap isLoading={isRejecting}>
                  {t("invitation.decline")}
                </LoadingSwap>
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-center gap-2 border-t border-border pt-4 opacity-60">
            <AppLogoIcon className="size-4" />
            <span className="text-xs text-muted-foreground">{COMPANY.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
