import { Suspense } from "react";

import { CandidatesList } from "./_components/candidates-list";

export default function CandidatesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <CandidatesList />
    </Suspense>
  );
}
