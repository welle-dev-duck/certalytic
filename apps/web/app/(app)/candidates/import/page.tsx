import { redirect } from "next/navigation";

import { getAppPageMetadata } from "@/lib/seo/page-metadata";
import { routes } from "@/lib/routes";

export async function generateMetadata() {
  return getAppPageMetadata("candidatesImport");
}

export default function ImportCandidatesPage() {
  redirect(routes.candidates());
}
