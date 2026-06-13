import { LanguageSettings } from "./_components/language-settings";
import { getSettingsPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getSettingsPageMetadata("language");
}

export default function LanguageSettingsPage() {
  return <LanguageSettings />;
}
