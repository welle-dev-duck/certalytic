import Link from "@/components/ui/link"

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      description={`How ${COMPANY.name} processes personal data for recruiters, team members, and candidates.`}
    >
      <p>
        {COMPANY.legalName} ({COMPANY.name}) operates an interview integrity
        decision-support platform for B2B customers. This Privacy Policy
        explains what we collect, why we process it, where it is stored, and
        your rights under the GDPR.
      </p>
      <h2>1. Roles under GDPR</h2>
      <ul>
        <li>
          <strong>Customer organisations</strong> are typically the{" "}
          <strong>Data Controller</strong> for candidate screening data they
          upload.
        </li>
        <li>
          {COMPANY.legalName} acts as a <strong>Data Processor</strong> when
          handling candidate CVs, transcripts, and analysis on behalf of
          customers.
        </li>
        <li>
          For account, billing, and marketing data relating to recruiters who
          register, we act as <strong>Data Controller</strong>.
        </li>
      </ul>
      <h2>2. Data sovereignty & sub-processors</h2>
      <p>
        All candidate content storage and AI inference remain within the European
        Union. Primary infrastructure is hosted on{" "}
        <strong>Hetzner Online GmbH</strong> (Germany / Finland). AI inference
        uses <strong>Mistral AI</strong> (France).
      </p>
      <h2>3. Your rights</h2>
      <p>
        Contact{" "}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        . You may lodge a complaint with your local supervisory authority.
      </p>
      <h2>4. Related documents</h2>
      <p>
        See also our{" "}
        <Link href={routes.legal.terms()} className="text-primary">
          Terms of Service
        </Link>
        ,{" "}
        <Link href={routes.legal.dpa()} className="text-primary">
          Data Processing Agreement
        </Link>
        , and{" "}
        <Link href={routes.legal.cookies()} className="text-primary">
          Cookie Policy
        </Link>
        .
      </p>
    </LegalDocumentLayout>
  );
}
