import { Link, usePage } from '@inertiajs/react';
import LegalDocumentLayout from '@/components/marketing/legal-document-layout';

export default function DpaPage() {
    const { company, name } = usePage().props;

    return (
        <LegalDocumentLayout
            title="Data Processing Agreement"
            description={`Processor terms for candidate data handled on behalf of ${name} customers.`}
        >
            <p>
                This Data Processing Agreement (&quot;DPA&quot;) forms part of
                the agreement between the Customer (Controller) and{' '}
                {company.legal_name} (Processor) when Customer uses {name} to
                process personal data relating to job candidates.
            </p>

            <h2>1. Subject matter & duration</h2>
            <p>
                Processor will process candidate personal data only to provide
                the integrity screening, transcription, and related features
                described in the{' '}
                <Link href="/legal/terms" className="text-primary">
                    Terms of Service
                </Link>
                , for the duration of the subscription plus any wind-down period
                required to delete or return data.
            </p>

            <h2>2. Nature & purpose of processing</h2>
            <ul>
                <li>Storage and parsing of CVs and interview transcripts</li>
                <li>
                    AI-assisted analysis to generate integrity scores, flags, and
                    summaries
                </li>
                <li>
                    Optional audio transcription with speaker diarization
                </li>
                <li>Display of results to authorised Customer users</li>
            </ul>

            <h2>3. Categories of data subjects & data</h2>
            <p>
                Data subjects: job candidates and interview participants.
                Data: identity and contact details, employment history, interview
                content, public profile references, derived integrity metrics.
            </p>

            <h2>4. Processor obligations</h2>
            <ul>
                <li>
                    Process data only on documented instructions from Controller
                </li>
                <li>
                    Ensure personnel confidentiality and least-privilege access
                </li>
                <li>
                    Implement appropriate technical and organisational measures
                    (encrypted storage, EU-only routing, secure job queues)
                </li>
                <li>
                    Assist Controller with data subject requests where feasible
                </li>
                <li>
                    Notify Controller without undue delay of personal data
                    breaches
                </li>
                <li>
                    Delete or return data upon termination, subject to legal
                    retention requirements
                </li>
            </ul>

            <h2>5. Sub-processors</h2>
            <p>Customer authorises the following sub-processors:</p>
            <ul>
                <li>
                    <strong>Hetzner Online GmbH</strong> - EU cloud
                    infrastructure (Germany / Finland)
                </li>
                <li>
                    <strong>Mistral AI</strong> - EU AI inference (France) for
                    OCR, evaluation, and transcription
                </li>
                <li>
                    <strong>Stripe, Inc.</strong> - payment processing (billing
                    data only; no candidate PII in payment flows)
                </li>
            </ul>
            <p>
                Processor will inform Customer of intended changes to
                sub-processors with reasonable notice.
            </p>

            <h2>6. International transfers</h2>
            <p>
                Candidate processing is designed to remain within the EU/EEA.
                Where any ancillary service involves transfers outside the EEA,
                Processor will implement appropriate safeguards (e.g. Standard
                Contractual Clauses).
            </p>

            <h2>7. Incorporation</h2>
            <p>
                By creating an account and checking acceptance of this DPA at
                registration, Customer agrees to this DPA. A PDF copy may be
                requested at{' '}
                <a href={`mailto:${company.email}`} className="text-primary">
                    {company.email}
                </a>
                .
            </p>
        </LegalDocumentLayout>
    );
}
