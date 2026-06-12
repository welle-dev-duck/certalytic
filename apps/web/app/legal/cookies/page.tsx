import Link from "@/components/ui/link"

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";

export default function CookiePolicyPage() {
  return (
    <LegalDocumentLayout
      title="Cookie Policy"
      description={`How ${COMPANY.name} uses cookies and similar technologies.`}
    >
      <p>
        We use cookies primarily for strictly necessary and functional
        purposes—not for third-party advertising profiles.
      </p>
      <h2>1. Strictly necessary</h2>
      <ul>
        <li>
          <strong>Session cookie</strong> — maintains your login session
        </li>
      </ul>
      <h2>2. Functional</h2>
      <ul>
        <li>
          <strong>appearance</strong> — stores light/dark theme preference
        </li>
      </ul>
      <h2>3. Payment (Stripe)</h2>
      <p>
        Stripe may set cookies required to complete payment and prevent fraud.
      </p>
      <h2>4. Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        . See also our{" "}
        <Link href={routes.legal.privacy()} className="text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalDocumentLayout>
  );
}
