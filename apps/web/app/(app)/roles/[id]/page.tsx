import { RoleDetail } from "./_components/role-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoleShowPage({ params }: PageProps) {
  const { id } = await params;

  return <RoleDetail roleId={id} />;
}
