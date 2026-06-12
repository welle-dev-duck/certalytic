import Link from "@/components/ui/link"

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      title="Terms of Service"
      description={`Terms governing use of the ${COMPANY.name} platform.`}
    >
      <p>
        These Terms are a contract between {COMPANY.legalName} and the
        organisation or individual registering for an account.
      </p>
      <h2>1. Service description</h2>
      <p>
        Certalytic provides interview integrity decision support for technical
        hiring. The platform does <strong>not</strong> make automated hiring
        or rejection decisions.
      </p>
      <h2>2. Decision support disclaimer</h2>
      <p>
        <strong>
          Integrity scores represent probability heuristics, not absolute
          verdicts.
        </strong>{" "}
        All outputs must be reviewed by qualified humans before action is taken.
      </p>
      <h2>3. Data processing</h2>
      <p>
        Our{" "}
        <Link href={routes.legal.dpa()} className="text-primary">
          Data Processing Agreement
        </Link>{" "}
        applies when we process candidate data on your behalf.
      </p>
      <h2>4. Contact</h2>
      <p>
        {COMPANY.legalName}, {COMPANY.addressLine}, {COMPANY.zip}{" "}
        {COMPANY.city}. Email:{" "}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        .
      </p>
    </LegalDocumentLayout>
  );
}
