import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { MarketingProcessSection } from "@/components/marketing/marketing-process-section";
import { MarketingReviewsSection } from "@/components/marketing/marketing-reviews-section";
import { MarketingRoadmapSection } from "@/components/marketing/marketing-roadmap-section";
import { MarketingStatsSection } from "@/components/marketing/marketing-stats-section";
import {
  AudienceSection,
  CtaSection,
  DemoSection,
  EuPrivacySection,
  PricingSection,
  ProductSection,
  WelcomeHero,
} from "@/features/marketing/welcome-sections";

export function WelcomePage() {
  return (
    <MarketingPageShell>
      <main>
        <WelcomeHero />
        <EuPrivacySection />
        <MarketingStatsSection />
        <MarketingProcessSection />
        <ProductSection />
        <DemoSection />
        <PricingSection />
        <AudienceSection />
        <MarketingReviewsSection />
        <MarketingRoadmapSection />
        <CtaSection />
      </main>
    </MarketingPageShell>
  );
}
