import { WelcomePage } from "./_components/welcome-page";
import { getMarketingHomeMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return getMarketingHomeMetadata();
}

export default function HomePage() {
  return <WelcomePage />;
}
