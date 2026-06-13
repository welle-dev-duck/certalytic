import { CandidateDetail } from "./_components/candidate-detail";
import { getAppPageMetadata } from "@/lib/seo/page-metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata() {
  return getAppPageMetadata("candidateDetail");
}

export default async function CandidateShowPage({ params }: PageProps) {
  const { id } = await params;

  return <CandidateDetail candidateId={id} />;
}
