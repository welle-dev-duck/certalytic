import { Link, usePage } from '@inertiajs/react';
import LegalDocumentLayout from '@/components/marketing/legal-document-layout';

export default function PrivacyPolicyPage() {
    const { company, name } = usePage().props;

    return (
        <LegalDocumentLayout
            title="Privacy Policy"
            description={`How ${name} processes personal data for recruiters, team members, and candidates.`}
        >
            <p>
                {company.legal_name} ({name}) operates an interview integrity
                decision-support platform for B2B customers. This Privacy Policy
                explains what we collect, why we process it, where it is stored,
                and your rights under the GDPR.
            </p>

            <h2>1. Roles under GDPR</h2>
            <ul>
                <li>
                    <strong>Customer organisations</strong> (your employer or
                    agency) are typically the <strong>Data Controller</strong>{' '}
                    for candidate screening data they upload.
                </li>
                <li>
                    {company.legal_name} acts as a{' '}
                    <strong>Data Processor</strong> when handling candidate CVs,
                    transcripts, and analysis on behalf of customers.
                </li>
                <li>
                    For account, billing, and marketing data relating to
                    recruiters who register, we act as{' '}
                    <strong>Data Controller</strong>.
                </li>
            </ul>

            <h2>2. Data sovereignty & sub-processors</h2>
            <p>
                All candidate content storage and AI inference remain within the
                European Union. Primary infrastructure is hosted on{' '}
                <strong>Hetzner Online GmbH</strong> (Germany / Finland). AI
                inference for OCR, chat evaluation, and transcription uses{' '}
                <strong>Mistral AI</strong> (France). We do not route candidate
                payloads through US cloud compute or CDNs in the processing path.
            </p>
            <p>
                CV bytes sent for OCR are processed ephemerally and are not
                retained by the model provider for training. Candidate data is
                contractually excluded from foundation-model training.
            </p>

            <h2>3. Categories of data</h2>
            <h3>Recruiter / team account data</h3>
            <ul>
                <li>Name, email, authentication credentials</li>
                <li>Team membership, role, billing identifiers via Stripe</li>
                <li>Usage metrics (screenings consumed, plan tier)</li>
            </ul>
            <h3>Candidate screening data (processor)</h3>
            <ul>
                <li>CV documents and extracted text</li>
                <li>Interview transcripts (uploaded or transcribed audio)</li>
                <li>LinkedIn / GitHub paste or public profile references</li>
                <li>Integrity scores, flags, AI-generated summaries</li>
            </ul>

            <h2>4. Purposes & legal bases</h2>
            <ul>
                <li>
                    <strong>Service delivery</strong> - performance of contract
                    (Art. 6(1)(b) GDPR)
                </li>
                <li>
                    <strong>Security & abuse prevention</strong> - legitimate
                    interest (Art. 6(1)(f) GDPR)
                </li>
                <li>
                    <strong>Billing</strong> - contract / legal obligation
                </li>
            </ul>

            <h2>5. Retention</h2>
            <p>
                Audio files uploaded for standalone transcription are deleted
                from storage after processing completes. Candidate records remain
                in the customer workspace until deleted by authorised team
                members. Account data is retained for the life of the contract
                plus statutory limitation periods.
            </p>

            <h2>6. Your rights</h2>
            <p>
                Depending on your role, you may request access, rectification,
                erasure, restriction, portability, or object to processing.
                Contact{' '}
                <a href={`mailto:${company.email}`} className="text-primary">
                    {company.email}
                </a>
                . You may lodge a complaint with your local supervisory authority.
            </p>

            <h2>7. Related documents</h2>
            <p>
                See also our{' '}
                <Link href="/legal/terms" className="text-primary">
                    Terms of Service
                </Link>
                ,{' '}
                <Link href="/legal/dpa" className="text-primary">
                    Data Processing Agreement
                </Link>
                , and{' '}
                <Link href="/legal/cookies" className="text-primary">
                    Cookie Policy
                </Link>
                .
            </p>
        </LegalDocumentLayout>
    );
}
