import { Suspense } from "react";

import { getTranslations } from "@/lib/i18n/server";

import { CandidatesList } from "./_components/candidates-list";

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
