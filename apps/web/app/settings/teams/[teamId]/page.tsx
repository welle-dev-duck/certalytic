import { TeamEdit } from "./_components/team-edit";

export default async function TeamEditPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <TeamEdit teamId={teamId} />;
}
