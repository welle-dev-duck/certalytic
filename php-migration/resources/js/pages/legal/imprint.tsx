import { Link, usePage } from '@inertiajs/react';
import LegalDocumentLayout from '@/components/marketing/legal-document-layout';

export default function ImprintPage() {
    const { company, name } = usePage().props;

    return (
        <LegalDocumentLayout
            title="Imprint (Impressum)"
            description="Legal disclosure pursuant to § 5 TMG (Germany) and applicable EU requirements."
        >
            <h2>Service provider</h2>
            <p>
                <strong>{company.legal_name}</strong>
                <br />
                {company.address_line}
                <br />
                {company.zip} {company.city}
                <br />
                {company.country}
            </p>

            <h2>Represented by</h2>
            <p>{company.managing_director}</p>

            <h2>Contact</h2>
            <p>
                Phone:{' '}
                <a
                    href={`tel:${company.phone.replace(/\s/g, '')}`}
                    className="text-primary"
                >
                    {company.phone}
                </a>
                <br />
                Email:{' '}
                <a href={`mailto:${company.email}`} className="text-primary">
                    {company.email}
                </a>
            </p>

            <h2>Register entry</h2>
            <p>
                Commercial register: {company.registration_number}
                <br />
                VAT ID: {company.vat_id}
            </p>

            <h2>Responsible for content</h2>
            <p>
                {company.managing_director}
                <br />
                {company.legal_name}
                <br />
                {company.address_line}, {company.zip} {company.city}
            </p>

            <h2>Dispute resolution</h2>
            <p>
                The European Commission provides a platform for online dispute
                resolution (ODR):{' '}
                <a
                    href="https://ec.europa.eu/consumers/odr"
                    className="text-primary"
                    target="_blank"
                    rel="noreferrer"
                >
                    https://ec.europa.eu/consumers/odr
                </a>
                . We are not obliged or willing to participate in dispute
                resolution proceedings before a consumer arbitration board
                unless required by law.
            </p>

            <h2>Platform</h2>
            <p>
                {name} - interview integrity decision support. See{' '}
                <Link href="/legal/privacy" className="text-primary">
                    Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/terms" className="text-primary">
                    Terms of Service
                </Link>
                .
            </p>
        </LegalDocumentLayout>
    );
}
