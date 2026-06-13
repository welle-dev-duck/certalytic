import Link from "@/components/ui/link";

import { LegalDocumentLayout } from "@/components/marketing/legal-document-layout";
import { COMPANY } from "@/lib/company";
import { getLegalPageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "@/lib/i18n/server";
import { routes } from "@/lib/routes";

export async function generateMetadata() {
  return getLegalPageMetadata("cookies");
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

export default async function CookiePolicyPage() {
  const t = await getTranslations("legal");

  return (
    <LegalDocumentLayout
      title={t("cookies.title")}
      description={t("cookies.description", companyParams)}
    >
      <p>{t("cookies.intro")}</p>
      <h2>{t("cookies.necessaryHeading")}</h2>
      <ul>
        <li>
          <strong>{t("cookies.necessarySessionLabel")}</strong> -{" "}
          {t("cookies.necessarySessionDescription")}
        </li>
      </ul>
      <h2>{t("cookies.functionalHeading")}</h2>
      <ul>
        <li>
          <strong>{t("cookies.functionalAppearanceLabel")}</strong> -{" "}
          {t("cookies.functionalAppearanceDescription")}
        </li>
      </ul>
      <h2>{t("cookies.paymentHeading")}</h2>
      <p>{t("cookies.paymentParagraph")}</p>
      <h2>{t("cookies.contactHeading")}</h2>
      <p>
        {t("cookies.contactQuestionsPrefix")}
        <a href={`mailto:${COMPANY.email}`} className="text-primary">
          {COMPANY.email}
        </a>
        {t("cookies.contactQuestionsMiddle")}
        <Link href={routes.legal.privacy()} className="text-primary">
          {t("cookies.contactPrivacyLink")}
        </Link>
        {t("cookies.contactSuffix")}
      </p>
    </LegalDocumentLayout>
  );
}
