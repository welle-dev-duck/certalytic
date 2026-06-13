import { OrganizationSettings } from "./_components/organization-settings";
import { getSettingsPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getSettingsPageMetadata("organization");
}

export default function OrganizationSettingsPage() {
  return <OrganizationSettings />;
}
