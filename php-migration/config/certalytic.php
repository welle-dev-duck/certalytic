<?php

return [

    'max_teams_per_user' => (int) env('CERTALYTIC_MAX_TEAMS_PER_USER', 3),

    'rate_limits' => [
        'login' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_LOGIN', 10),
            'decay_seconds' => 60,
            'by' => 'ip',
        ],
        'register' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_REGISTER', 5),
            'decay_seconds' => 3600,
            'by' => 'ip',
        ],
        'password-reset' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_PASSWORD_RESET', 5),
            'decay_seconds' => 3600,
            'by' => 'ip',
        ],
        'authenticated' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_AUTHENTICATED', 120),
            'decay_seconds' => 60,
            'by' => 'user',
        ],
        'screening' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_SCREENING', 10),
            'decay_seconds' => 60,
            'by' => 'user',
        ],
        'transcription' => [
            'max_attempts' => (int) env('CERTALYTIC_RATE_LIMIT_TRANSCRIPTION', 5),
            'decay_seconds' => 60,
            'by' => 'user',
        ],
    ],

    'score_weights' => [
        'cv' => 0.25,
        'interview' => 0.50,
        'cross_source' => 0.15,
        'identity' => 0.10,
    ],

    'variance_threshold' => 20,

    'round_weights' => [
        1 => 0.25,
        2 => 0.35,
        3 => 0.40,
    ],

    'storage' => [
        'disk' => env('FILESYSTEM_DISK', 's3'),
        'signed_url_ttl_minutes' => (int) env('CERTALYTIC_SIGNED_URL_TTL', 15),
    ],

    'limits' => [
        'cv_max_kilobytes' => (int) env('CERTALYTIC_CV_MAX_KB', 5_120),
        'transcript_file_max_kilobytes' => (int) env('CERTALYTIC_TRANSCRIPT_FILE_MAX_KB', 5_120),
        'audio_max_kilobytes' => (int) env('CERTALYTIC_AUDIO_MAX_KB', 102_400),
        'audio_max_duration_minutes' => (int) env('CERTALYTIC_AUDIO_MAX_MINUTES', 60),
        'cv_text_max_words' => 10_000,
        'cv_text_max_characters' => 75_000,
        'transcript_text_max_words' => 20_000,
        'transcript_text_max_characters' => 150_000,
        'name_max_characters' => 255,
        'email_max_characters' => 255,
        'linkedin_text_max_characters' => 100_000,
        'interviewer_notes_max_characters' => 50_000,
        'github_url_max_characters' => 2_048,
        'role_title_max_characters' => 255,
        'role_description_max_characters' => 20_000,
        'mistral_max_input_tokens' => (int) env('CERTALYTIC_MISTRAL_MAX_INPUT_TOKENS', 128_000),
        'chars_per_token_estimate' => 4,
    ],

    'transcript' => [
        'soft_warning_words' => 24_000,
        'hard_cap_characters' => 120_000,
        'max_transcript_files' => 3,
    ],

    'transcription_pack' => [
        'name' => 'Transcription Token Pack',
        'tokens' => 5,
        'price' => 15,
        'stripe_price' => env('STRIPE_PRICE_TRANSCRIPT_FIVE_PACK'),
    ],

    'plans' => [
        'free' => [
            'name' => 'Free',
            'price' => 0,
            'seats' => 1,
            'tokens' => 3,
            'cross_source' => false,
            'cross_source_manual' => false,
            'full_breakdown' => false,
            'token_packs' => false,
            'priority_queue' => false,
            'watermarked_exports' => true,
            'saved_roles' => true,
            'role_context_assets' => false,
            'max_role_documents' => 0,
            'stripe_price' => null,
        ],
        'starter' => [
            'name' => 'Starter',
            'price' => 159,
            'seats' => 1,
            'tokens' => 20,
            'cross_source' => false,
            'cross_source_manual' => true,
            'full_breakdown' => true,
            'token_packs' => true,
            'priority_queue' => false,
            'watermarked_exports' => false,
            'saved_roles' => true,
            'role_context_assets' => false,
            'max_role_documents' => 0,
            'stripe_price' => env('STRIPE_PRICE_STARTER'),
        ],
        'growth' => [
            'name' => 'Growth',
            'price' => 349,
            'seats' => 3,
            'tokens' => 50,
            'cross_source' => true,
            'cross_source_manual' => true,
            'full_breakdown' => true,
            'token_packs' => true,
            'priority_queue' => false,
            'watermarked_exports' => false,
            'saved_roles' => true,
            'role_context_assets' => false,
            'max_role_documents' => 0,
            'stripe_price' => env('STRIPE_PRICE_GROWTH'),
        ],
        'scale' => [
            'name' => 'Scale',
            'price' => 799,
            'seats' => 5,
            'tokens' => 125,
            'cross_source' => true,
            'cross_source_manual' => true,
            'full_breakdown' => true,
            'token_packs' => true,
            'priority_queue' => true,
            'watermarked_exports' => false,
            'saved_roles' => true,
            'role_context_assets' => true,
            'max_role_documents' => 3,
            'stripe_price' => env('STRIPE_PRICE_SCALE'),
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price' => null,
            'seats' => 6,
            'tokens' => null,
            'cross_source' => true,
            'cross_source_manual' => true,
            'full_breakdown' => true,
            'token_packs' => true,
            'priority_queue' => true,
            'watermarked_exports' => false,
            'saved_roles' => true,
            'role_context_assets' => true,
            'max_role_documents' => 3,
            'stripe_price' => null,
        ],
    ],

    'token_packs' => [
        'quick_refill' => [
            'name' => 'Quick Refill',
            'tokens' => 10,
            'price' => 99,
            'stripe_price' => env('STRIPE_PRICE_PACK_QUICK'),
        ],
        'pipeline_surge' => [
            'name' => 'Pipeline Surge',
            'tokens' => 35,
            'price' => 299,
            'stripe_price' => env('STRIPE_PRICE_PACK_SURGE'),
        ],
        'high_volume_boost' => [
            'name' => 'High-Volume Boost',
            'tokens' => 100,
            'price' => 750,
            'stripe_price' => env('STRIPE_PRICE_PACK_BOOST'),
        ],
    ],

    'queues' => [
        'default' => env('CERTALYTIC_QUEUE', 'default'),
        'priority' => env('CERTALYTIC_PRIORITY_QUEUE', 'screenings-priority'),
        'transcriptions' => env('CERTALYTIC_TRANSCRIPTIONS_QUEUE', 'transcriptions'),
    ],

    'mistral' => [
        'api_key' => env('MISTRAL_API_KEY'),
        'base_url' => env('MISTRAL_BASE_URL', 'https://api.mistral.ai/v1'),
        'ocr_model' => env('MISTRAL_OCR_MODEL', 'mistral-ocr-latest'),
        'chat_model' => env('MISTRAL_CHAT_MODEL', 'mistral-small-latest'),
        'transcription_model' => env('MISTRAL_TRANSCRIPTION_MODEL', 'voxtral-mini-latest'),
        'timeout' => env('MISTRAL_TIMEOUT', 120),
        'transcription_timeout' => env('MISTRAL_TRANSCRIPTION_TIMEOUT', 600),
    ],

    'company' => [
        'legal_name' => env('CERTALYTIC_COMPANY_LEGAL_NAME', 'Certalytic GmbH'),
        'address_line' => env('CERTALYTIC_COMPANY_ADDRESS', 'Musterstraße 1'),
        'zip' => env('CERTALYTIC_COMPANY_ZIP', '10115'),
        'city' => env('CERTALYTIC_COMPANY_CITY', 'Berlin'),
        'country' => env('CERTALYTIC_COMPANY_COUNTRY', 'Germany'),
        'phone' => env('CERTALYTIC_COMPANY_PHONE', '+49 30 12345678'),
        'email' => env('CERTALYTIC_COMPANY_EMAIL', 'hello@certalytic.com'),
        'registration_number' => env('CERTALYTIC_COMPANY_REG_NUMBER', 'HRB 000000'),
        'vat_id' => env('CERTALYTIC_COMPANY_VAT_ID', 'DE000000000'),
        'managing_director' => env('CERTALYTIC_COMPANY_DIRECTOR', 'Managing Director'),
    ],

    'social' => [
        'linkedin' => env('CERTALYTIC_SOCIAL_LINKEDIN', 'https://linkedin.com/company/certalytic'),
        'github' => env('CERTALYTIC_SOCIAL_GITHUB', 'https://github.com/certalytic'),
        'x' => env('CERTALYTIC_SOCIAL_X', 'https://x.com/certalytic'),
    ],

    'marketing' => [
        'stats' => [
            'candidates_screened' => env('CERTALYTIC_MARKETING_CANDIDATES_SCREENED', '12,400+'),
            'customers' => env('CERTALYTIC_MARKETING_CUSTOMERS', '180+'),
            'countries' => env('CERTALYTIC_MARKETING_COUNTRIES', '14'),
            'audio_hours' => env('CERTALYTIC_MARKETING_AUDIO_HOURS', '2,800+'),
            'saved_millions' => env('CERTALYTIC_MARKETING_SAVED_MILLIONS', '€4.2M'),
        ],
        'roadmap' => [
            [
                'quarter' => 'Q3 2026',
                'title' => 'ATS integrations',
                'description' => 'Push integrity reports into Greenhouse, Lever, and Workday without manual copy-paste.',
            ],
            [
                'quarter' => 'Q4 2026',
                'title' => 'Enterprise SSO',
                'description' => 'SAML and OIDC single sign-on with seat provisioning for agency and in-house TA teams.',
            ],
            [
                'quarter' => 'Q1 2027',
                'title' => 'Batch screening',
                'description' => 'Upload a cohort of candidates against one role profile and compare integrity signals side by side.',
            ],
            [
                'quarter' => 'Q2 2027',
                'title' => 'Public API & webhooks',
                'description' => 'Programmatic screening triggers and signed webhook delivery for custom hiring stacks.',
            ],
        ],
    ],

];
