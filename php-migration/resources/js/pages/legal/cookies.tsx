import { Link, usePage } from '@inertiajs/react';
import LegalDocumentLayout from '@/components/marketing/legal-document-layout';

export default function CookiePolicyPage() {
    const { company } = usePage().props;

    return (
        <LegalDocumentLayout
            title="Cookie Policy"
            description={`How ${name} uses cookies and similar technologies.`}
        >
            <p>
                This Cookie Policy explains what cookies we use, why we use
                them, and your choices. We use cookies primarily for strictly
                necessary and functional purposes - not for third-party
                advertising profiles.
            </p>

            <h2>1. What are cookies?</h2>
            <p>
                Cookies are small text files stored on your device when you
                visit a website. We also use similar local storage for UI
                preferences where applicable.
            </p>

            <h2>2. Cookies we use</h2>
            <h3>Strictly necessary</h3>
            <ul>
                <li>
                    <strong>Session cookie</strong> - maintains your login
                    session and CSRF protection (Laravel session)
                </li>
                <li>
                    <strong>XSRF-TOKEN</strong> - prevents cross-site request
                    forgery on form submissions
                </li>
            </ul>
            <h3>Functional</h3>
            <ul>
                <li>
                    <strong>sidebar_state</strong> - remembers sidebar
                    expanded/collapsed preference
                </li>
                <li>
                    <strong>appearance</strong> - stores light/dark theme
                    preference if selected
                </li>
            </ul>
            <h3>Payment (Stripe)</h3>
            <p>
                When you interact with Stripe Checkout or the billing portal,
                Stripe may set cookies required to complete payment and prevent
                fraud. See Stripe&apos;s privacy documentation for details.
            </p>

            <h2>3. Analytics</h2>
            <p>
                We do not currently deploy third-party marketing or analytics
                cookies on the application. If this changes, we will update
                this policy and request consent where required.
            </p>

            <h2>4. Managing cookies</h2>
            <p>
                You can block or delete cookies via your browser settings.
                Blocking strictly necessary cookies will prevent login and core
                functionality from working.
            </p>

            <h2>5. Contact</h2>
            <p>
                Questions:{' '}
                <a href={`mailto:${company.email}`} className="text-primary">
                    {company.email}
                </a>
                . See also our{' '}
                <Link href="/legal/privacy" className="text-primary">
                    Privacy Policy
                </Link>
                .
            </p>
        </LegalDocumentLayout>
    );
}
