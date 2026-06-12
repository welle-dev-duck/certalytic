<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Integrity Dossier- {{ $candidate->name }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #1a2e28;
            line-height: 1.45;
            margin: 0;
            padding: 28px 32px;
        }
        h1, h2, h3 { margin: 0 0 8px; font-weight: 700; }
        h1 { font-size: 18pt; }
        h2 { font-size: 12pt; margin-top: 18px; border-bottom: 1px solid #c5d4cf; padding-bottom: 4px; }
        .muted { color: #5c6f68; }
        .header { margin-bottom: 18px; }
        .brand { font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: #2f5c52; font-weight: 700; }
        .meta-table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; }
        .meta-table td { padding: 6px 8px; border: 1px solid #d8e3df; vertical-align: top; }
        .meta-label { width: 34%; background: #f3f7f5; font-weight: 600; color: #3d524c; }
        .score-box {
            border: 2px solid #2f5c52;
            padding: 14px;
            text-align: center;
            margin: 12px 0 16px;
        }
        .score-value { font-size: 28pt; font-weight: 700; color: #2f5c52; }
        .disclaimer {
            background: #fff8eb;
            border: 1px solid #e8c468;
            padding: 10px 12px;
            font-size: 9pt;
            margin-bottom: 16px;
        }
        .metric { margin-bottom: 10px; }
        .metric-row { width: 100%; border-collapse: collapse; }
        .metric-row td { padding: 2px 0; vertical-align: middle; }
        .bar-track { background: #e5ece9; height: 8px; width: 100%; }
        .bar-fill { background: #2f5c52; height: 8px; }
        .flag {
            border: 1px solid #e5ece9;
            padding: 8px 10px;
            margin-bottom: 8px;
        }
        .flag-type { font-size: 8pt; font-weight: 700; text-transform: uppercase; color: #8a4b12; }
        ul { margin: 6px 0 0 16px; padding: 0; }
        li { margin-bottom: 4px; }
        .footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #c5d4cf;
            font-size: 8pt;
            color: #5c6f68;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">Certalytic · Integrity dossier</div>
        <h1>{{ $candidate->name }}</h1>
        <p class="muted">
            {{ $candidate->jobRole?->title ?? $candidate->role ?? 'Role not specified' }}
            · Generated {{ $generatedAt->timezone('UTC')->format('j M Y, H:i') }} UTC
        </p>
    </div>

    <div class="disclaimer">
        This score represents a probability heuristic, not an absolute verdict. Use it to guide your human follow-up questions.
    </div>

    @include('pdf.partials.candidate-dossier', [
        'candidate' => $candidate,
        'report' => $report,
        'showFullBreakdown' => $showFullBreakdown,
        'behaviourAnalysis' => $report['behaviourAnalysis'] ?? null,
        'personalityAnalysis' => $report['personalityAnalysis'] ?? null,
    ])

    <div class="footer">
        Certalytic- EU-sovereign interview integrity decision support. This dossier is for internal hiring review only.
    </div>
</body>
</html>
