import { CandidateDetail } from "./_components/candidate-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidateShowPage({ params }: PageProps) {
  const { id } = await params;

  return <CandidateDetail candidateId={id} />;
}
