import { Link, usePage } from '@inertiajs/react';
import LegalDocumentLayout from '@/components/marketing/legal-document-layout';

export default function TermsOfServicePage() {
    const { company, name } = usePage().props;

    return (
        <LegalDocumentLayout
            title="Terms of Service"
            description={`Terms governing use of the ${name} platform.`}
        >
            <p>
                These Terms of Service (&quot;Terms&quot;) are a contract between{' '}
                {company.legal_name} (&quot;Certalytic&quot;, &quot;we&quot;,
                &quot;us&quot;) and the organisation or individual registering
                for an account (&quot;Customer&quot;, &quot;you&quot;).
            </p>

            <h2>1. Service description</h2>
            <p>
                Certalytic provides interview integrity decision support for
                technical hiring. The platform analyses CVs, transcripts, and
                optional public profile content to produce probabilistic
                integrity signals. Certalytic does <strong>not</strong> make
                automated hiring or rejection decisions.
            </p>

            <h2>2. Decision support disclaimer</h2>
            <p>
                <strong>
                    This score represents a probability heuristic, not an
                    absolute verdict. Use it to guide your human follow-up
                    questions.
                </strong>{' '}
                Certalytic is not responsible for hiring, rejection, or
                employment decisions made by Customer or its users. All outputs
                must be reviewed by qualified humans before action is taken.
            </p>

            <h2>3. Subscriptions, seats & tokens</h2>
            <ul>
                <li>
                    Plans include a defined number of screening tokens per billing
                    cycle as described on the pricing page.
                </li>
                <li>
                    Token packs and transcription packs are sold separately;
                    unused pack tokens expire at the end of the billing cycle
                    unless otherwise stated at purchase.
                </li>
                <li>
                    Fees are billed via Stripe. Failed payments may suspend
                    access until resolved.
                </li>
            </ul>

            <h2>4. Fair use & input limits</h2>
            <ul>
                <li>
                    Transcript text is subject to a hard cap (currently 120,000
                    characters per evaluation path). Content beyond the cap is
                    truncated with indication where applicable.
                </li>
                <li>
                    Upload size limits apply to CVs, transcript files, and
                    audio as shown in the product UI.
                </li>
                <li>
                    Rate limits protect platform stability; abusive automation
                    may result in suspension.
                </li>
            </ul>

            <h2>5. Customer obligations</h2>
            <ul>
                <li>
                    You must have a lawful basis to process candidate personal
                    data and provide required candidate notices where
                    applicable.
                </li>
                <li>
                    You will not use the service for unlawful discrimination or
                    solely automated hiring decisions.
                </li>
                <li>
                    You are responsible for credentials and team member access.
                </li>
            </ul>

            <h2>6. Data processing</h2>
            <p>
                Where Certalytic processes candidate data on your behalf, our{' '}
                <Link href="/legal/dpa" className="text-primary">
                    Data Processing Agreement
                </Link>{' '}
                applies and is incorporated by reference upon account creation.
            </p>

            <h2>7. Liability</h2>
            <p>
                To the maximum extent permitted by law, Certalytic&apos;s
                aggregate liability is limited to fees paid in the twelve months
                preceding the claim. We are not liable for indirect or
                consequential damages, or for decisions taken on the basis of
                integrity scores.
            </p>

            <h2>8. Contact</h2>
            <p>
                {company.legal_name}, {company.address_line},{' '}
                {company.zip} {company.city}, {company.country}. Email:{' '}
                <a href={`mailto:${company.email}`} className="text-primary">
                    {company.email}
                </a>
                .
            </p>
        </LegalDocumentLayout>
    );
}
