import { Suspense } from "react";

import { getAppPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";

import { CandidatesList } from "./_components/candidates-list";

export async function generateMetadata() {
  return getAppPageMetadata("candidates");
}

export default async function CandidatesPage() {
  const t = await getTranslations("app");

  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          {t("candidates.page.loading")}
        </div>
      }
    >
      <CandidatesList />
    </Suspense>
  );
}
