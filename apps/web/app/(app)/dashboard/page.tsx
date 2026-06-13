import { DashboardView } from "./_components/dashboard-view";
import { getAppPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getAppPageMetadata("dashboard");
}

export default function DashboardPage() {
  return <DashboardView />;
}
