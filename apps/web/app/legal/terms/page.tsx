import Link from "@/components/ui/link";

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { getLegalPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";
import { routes } from "@/lib/routes";

export async function generateMetadata() {
  return getLegalPageMetadata("terms");
}

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

export default async function TermsOfServicePage() {
  const t = await getTranslations("legal");
  const contactText = t("terms.contactParagraph", companyParams);
  const [contactBefore, contactAfter = ""] = contactText.split(COMPANY.email);

  return (
    <LegalDocumentLayout
      title={t("terms.title")}
      description={t("terms.description", companyParams)}
    >
      <p>{t("terms.intro", companyParams)}</p>
      <h2>{t("terms.serviceHeading")}</h2>
      <p>
        {t("terms.serviceParagraphBefore", companyParams)}
        <strong>{t("terms.serviceParagraphNot")}</strong>
        {t("terms.serviceParagraphAfter")}
      </p>
      <h2>{t("terms.disclaimerHeading")}</h2>
      <p>
        <strong>{t("terms.disclaimerEmphasis")}</strong>{" "}
        {t("terms.disclaimerRest")}
      </p>
      <h2>{t("terms.processingHeading")}</h2>
      <p>
        {t("terms.processingPrefix")}
        <Link href={routes.legal.dpa()} className="text-primary">
          {t("terms.processingDpaLink")}
        </Link>{" "}
        {t("terms.processingSuffix")}
      </p>
      <h2>{t("terms.contactHeading")}</h2>
      <p>
        {contactBefore}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        {contactAfter}
      </p>
    </LegalDocumentLayout>
  );
}
