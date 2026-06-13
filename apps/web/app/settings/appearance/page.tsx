import { AppearanceSettings } from "./_components/appearance-settings";
import { getSettingsPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getSettingsPageMetadata("appearance");
}

export default function AppearanceSettingsPage() {
  return <AppearanceSettings />;
}
