import { BillingView } from "./_components/billing-view";
import { getAppPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getAppPageMetadata("billing");
}

export default function BillingPage() {
  return <BillingView />;
}
