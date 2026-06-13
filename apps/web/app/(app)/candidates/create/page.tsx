import { redirect } from "next/navigation";

import { getAppPageMetadata } from "@/lib/seo/page-metadata";
import { routes } from "@/lib/routes";

export async function generateMetadata() {
  return getAppPageMetadata("candidatesCreate");
}

export default function CreateCandidatePage() {
  redirect(`${routes.candidates()}?screen=1`);
}
