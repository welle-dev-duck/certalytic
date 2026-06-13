import { Suspense } from "react";

import { getAppPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";

import { InvitationPanel } from "./_components/invitation-panel";

export async function generateMetadata() {
  return getAppPageMetadata("invitation");
}

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
