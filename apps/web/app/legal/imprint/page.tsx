import Link from "@/components/ui/link"

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

export default function ImprintPage() {
  return (
    <LegalDocumentLayout
      title="Imprint (Impressum)"
      description="Legal disclosure pursuant to § 5 TMG (Germany) and applicable EU requirements."
    >
      <h2>Service provider</h2>
      <p>
        <strong>{COMPANY.legalName}</strong>
        <br />
        {COMPANY.addressLine}
        <br />
        {COMPANY.zip} {COMPANY.city}
        <br />
        {COMPANY.country}
      </p>
      <h2>Represented by</h2>
      <p>{COMPANY.managingDirector}</p>
      <h2>Contact</h2>
      <p>
        Email:{" "}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
      </p>
      <h2>Register entry</h2>
      <p>
        Commercial register: {COMPANY.registrationNumber}
        <br />
        VAT ID: {COMPANY.vatId}
      </p>
      <h2>Platform</h2>
      <p>
        {COMPANY.name} — interview integrity decision support. See{" "}
        <Link href={routes.legal.privacy()} className="text-primary">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href={routes.legal.terms()} className="text-primary">
          Terms of Service
        </Link>
        .
      </p>
    </LegalDocumentLayout>
  );
}
