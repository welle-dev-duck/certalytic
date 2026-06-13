import { SecuritySettings } from "./_components/security-settings";
import { getSettingsPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getSettingsPageMetadata("security");
}

export default function SecuritySettingsPage() {
  return <SecuritySettings />;
}
