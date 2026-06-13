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

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal");

  return (
    <LegalDocumentLayout
      title={t("privacy.title")}
      description={t("privacy.description", companyParams)}
    >
      <p>{t("privacy.intro", companyParams)}</p>
      <h2>{t("privacy.rolesHeading")}</h2>
      <ul>
        <li>
          {t("privacy.rolesCustomerOrgsBefore")}
          <strong>{t("privacy.rolesCustomerOrgsEmphasis")}</strong>
          {t("privacy.rolesCustomerOrgsAfter")}
        </li>
        <li>
          {t("privacy.rolesProcessorBefore", companyParams)}
          <strong>{t("privacy.rolesProcessorEmphasis")}</strong>
          {t("privacy.rolesProcessorAfter")}
        </li>
        <li>
          {t("privacy.rolesControllerBefore")}
          <strong>{t("privacy.rolesControllerEmphasis")}</strong>
          {t("privacy.rolesControllerAfter")}
        </li>
      </ul>
      <h2>{t("privacy.sovereigntyHeading")}</h2>
      <p>
        {t("privacy.sovereigntyParagraphBefore")}
        <strong>{t("privacy.sovereigntyParagraphHetzner")}</strong>
        {t("privacy.sovereigntyParagraphMiddle")}
        <strong>{t("privacy.sovereigntyParagraphMistral")}</strong>
        {t("privacy.sovereigntyParagraphAfter")}
      </p>
      <h2>{t("privacy.rightsHeading")}</h2>
      <p>
        {t("privacy.rightsContactPrefix")}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        {t("privacy.rightsContactSuffix")}
      </p>
      <h2>{t("privacy.relatedDocsHeading")}</h2>
      <p>
        {t("privacy.relatedDocsPrefix")}
        <Link href={routes.legal.terms()} className="text-primary">
          {t("privacy.relatedDocsTerms")}
        </Link>
        {t("privacy.relatedDocsTermsSeparator")}
        <Link href={routes.legal.dpa()} className="text-primary">
          {t("privacy.relatedDocsDpa")}
        </Link>
        {t("privacy.relatedDocsDpaSeparator")}
        <Link href={routes.legal.cookies()} className="text-primary">
          {t("privacy.relatedDocsCookies")}
        </Link>
        {t("privacy.relatedDocsSuffix")}
      </p>
    </LegalDocumentLayout>
  );
}
