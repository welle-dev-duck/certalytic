import { RolesList } from "./_components/roles-list";
import { getAppPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getAppPageMetadata("roles");
}

export default function RolesPage() {
  return <RolesList />;
}
