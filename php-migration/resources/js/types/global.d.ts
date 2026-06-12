import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            currentTeam: Team | null;
            teams: Team[];
            company: import('@/types/company').CompanyInfo;
            socialLinks: import('@/types/company').SocialLinks;
            marketing: import('@/types/marketing').MarketingData;
            tokenUsage: import('@/types/candidates').TokenUsage | null;
            [key: string]: unknown;
        };
    }
}
