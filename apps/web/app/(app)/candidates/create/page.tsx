import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

export default function CreateCandidatePage() {
  redirect(`${routes.candidates()}?screen=1`);
}
