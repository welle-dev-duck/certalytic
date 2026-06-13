import { Suspense } from "react";

import { getTranslations } from "@/lib/i18n/server";

import { InvitationPanel } from "./_components/invitation-panel";

export default async function InvitationPage() {
  const t = await getTranslations("app");

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          {t("invitation.loading")}
        </div>
      }
    >
      <InvitationPanel />
    </Suspense>
  );
}
