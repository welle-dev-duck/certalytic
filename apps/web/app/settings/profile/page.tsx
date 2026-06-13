import { ProfileSettings } from "./_components/profile-settings";
import { getSettingsPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getSettingsPageMetadata("profile");
}

export default function ProfileSettingsPage() {
  return <ProfileSettings />;
}
