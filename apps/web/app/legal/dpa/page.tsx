import Link from "@/components/ui/link"

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

export default function DpaPage() {
  return (
    <LegalDocumentLayout
      title="Data Processing Agreement"
      description={`Processor terms for candidate data handled on behalf of ${COMPANY.name} customers.`}
    >
      <p>
        This DPA forms part of the agreement between the Customer (Controller)
        and {COMPANY.legalName} (Processor) when Customer uses {COMPANY.name}{" "}
        to process personal data relating to job candidates.
      </p>
      <h2>1. Subject matter & duration</h2>
      <p>
        Processor will process candidate personal data only to provide integrity
        screening and related features described in the{" "}
        <Link href={routes.legal.terms()} className="text-primary">
          Terms of Service
        </Link>
        .
      </p>
      <h2>2. Nature & purpose of processing</h2>
      <ul>
        <li>Storage and parsing of CVs and interview transcripts</li>
        <li>AI-assisted analysis to generate integrity scores and flags</li>
        <li>Display of results to authorised Customer users</li>
      </ul>
      <h2>3. Sub-processors</h2>
      <p>
        EU-based infrastructure (Hetzner) and AI inference (Mistral AI, France).
        Customer authorises these sub-processors subject to GDPR Article 28
        requirements.
      </p>
    </LegalDocumentLayout>
  );
}
