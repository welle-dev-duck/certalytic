export type MarketingStats = {
    candidates_screened: string;
    customers: string;
    countries: string;
    audio_hours: string;
    saved_millions: string;
};

export type MarketingRoadmapItem = {
    quarter: string;
    title: string;
    description: string;
};

export type MarketingPricingPlan = {
    value: string;
    label: string;
    price: number | null;
    tokens: number | null;
    seats: number;
    features: string[];
    highlighted?: boolean;
};

export type MarketingPricing = {
    free: MarketingPricingPlan;
    plans: MarketingPricingPlan[];
    enterprise: {
        label: string;
        features: string[];
    };
};

export type MarketingData = {
    stats: MarketingStats;
    roadmap: MarketingRoadmapItem[];
    pricing: MarketingPricing;
};
