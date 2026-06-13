import Link from "@/components/ui/link";

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { getTranslations } from "@/lib/i18n/server";
import { routes } from "@/lib/routes";

const companyParams = {
  company: COMPANY.name,
  legalName: COMPANY.legalName,
  email: COMPANY.email,
  addressLine: COMPANY.addressLine,
  zip: COMPANY.zip,
  city: COMPANY.city,
  registrationNumber: COMPANY.registrationNumber,
  vatId: COMPANY.vatId,
};

export default async function ImprintPage() {
  const t = await getTranslations("legal");

  return (
    <LegalDocumentLayout
      title={t("imprint.title")}
      description={t("imprint.description")}
    >
      <h2>{t("imprint.providerHeading")}</h2>
      <p>
        <strong>{COMPANY.legalName}</strong>
        <br />
        {COMPANY.addressLine}
        <br />
        {COMPANY.zip} {COMPANY.city}
        <br />
        {COMPANY.country}
      </p>
      <h2>{t("imprint.representedHeading")}</h2>
      <p>{COMPANY.managingDirector}</p>
      <h2>{t("imprint.contactHeading")}</h2>
      <p>
        {t("imprint.contactEmailPrefix")}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
      </p>
      <h2>{t("imprint.registerHeading")}</h2>
      <p>
        {t("imprint.registerCommercial", companyParams)}
        <br />
        {t("imprint.registerVat", companyParams)}
      </p>
      <h2>{t("imprint.platformHeading")}</h2>
      <p>
        {t("imprint.platformPrefix", companyParams)}
        <Link href={routes.legal.privacy()} className="text-primary">
          {t("imprint.platformPrivacyLink")}
        </Link>
        {t("imprint.platformMiddle")}
        <Link href={routes.legal.terms()} className="text-primary">
          {t("imprint.platformTermsLink")}
        </Link>
        {t("imprint.platformSuffix")}
      </p>
    </LegalDocumentLayout>
  );
}
