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

export default async function DpaPage() {
  const t = await getTranslations("legal");

  return (
    <LegalDocumentLayout
      title={t("dpa.title")}
      description={t("dpa.description", companyParams)}
    >
      <p>{t("dpa.intro", companyParams)}</p>
      <h2>{t("dpa.subjectHeading")}</h2>
      <p>
        {t("dpa.subjectPrefix")}
        <Link href={routes.legal.terms()} className="text-primary">
          {t("dpa.subjectTermsLink")}
        </Link>
        {t("dpa.subjectSuffix")}
      </p>
      <h2>{t("dpa.natureHeading")}</h2>
      <ul>
        <li>{t("dpa.natureItemStorage")}</li>
        <li>{t("dpa.natureItemAnalysis")}</li>
        <li>{t("dpa.natureItemDisplay")}</li>
      </ul>
      <h2>{t("dpa.subProcessorsHeading")}</h2>
      <p>{t("dpa.subProcessorsParagraph")}</p>
    </LegalDocumentLayout>
  );
}
