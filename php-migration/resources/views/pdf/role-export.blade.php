<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Role Dossier- {{ $role->title }}</title>
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
        h3 { font-size: 11pt; margin-top: 14px; }
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
        .candidate-section {
            page-break-before: always;
            padding-top: 8px;
        }
        .candidate-section:first-of-type {
            page-break-before: auto;
        }
        .summary-grid { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .summary-grid th, .summary-grid td {
            border: 1px solid #d8e3df;
            padding: 6px 8px;
            text-align: left;
        }
        .summary-grid th { background: #f3f7f5; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">Certalytic · Role dossier</div>
        <h1>{{ $role->title }}</h1>
        <p class="muted">
            Created {{ $role->created_at?->timezone('UTC')->format('j M Y') ?? '—' }}
            · Generated {{ $generatedAt->timezone('UTC')->format('j M Y, H:i') }} UTC
        </p>
    </div>

    <div class="disclaimer">
        This score represents a probability heuristic, not an absolute verdict. Use it to guide your human follow-up questions.
    </div>

    <h2>Role overview</h2>
    <table class="meta-table">
        <tr>
            <td class="meta-label">Total screenings</td>
            <td>{{ $stats['total_candidates'] }}</td>
        </tr>
        <tr>
            <td class="meta-label">Completed dossiers</td>
            <td>{{ $stats['completed_candidates'] }}</td>
        </tr>
        <tr>
            <td class="meta-label">Average integrity</td>
            <td>{{ $stats['avg_integrity'] !== null ? number_format((float) $stats['avg_integrity'], 1) : '—' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Risk distribution</td>
            <td>
                High trust (≥75): {{ $stats['distribution']['high'] }} ·
                Moderate (50–74): {{ $stats['distribution']['medium'] }} ·
                Elevated (&lt;50): {{ $stats['distribution']['low'] }}
            </td>
        </tr>
    </table>

    @if ($role->description)
        <h2>Job description</h2>
        <p>{{ $role->description }}</p>
    @endif

    @if (count($candidateReports) > 0)
        <h2>Candidate summary</h2>
        <table class="summary-grid">
            <thead>
                <tr>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th>Risk level</th>
                    <th>Flags</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($candidateReports as $entry)
                    <tr>
                        <td>{{ $entry['candidate']->name }}</td>
                        <td>{{ number_format((float) $entry['report']['score'], 1) }}</td>
                        <td>{{ ucfirst($entry['report']['level']) }}</td>
                        <td>{{ count($entry['report']['flags']) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <h2>Individual candidate dossiers</h2>

        @foreach ($candidateReports as $entry)
            @php
                $candidate = $entry['candidate'];
                $report = $entry['report'];
            @endphp
            <div class="candidate-section">
                <h3>{{ $candidate->name }}</h3>
                <p class="muted">{{ $candidate->email ?? 'No email on file' }}</p>
                @include('pdf.partials.candidate-dossier', [
                    'candidate' => $candidate,
                    'report' => $report,
                    'showFullBreakdown' => $showFullBreakdown,
                    'behaviourAnalysis' => $report['behaviourAnalysis'] ?? null,
                    'personalityAnalysis' => $report['personalityAnalysis'] ?? null,
                ])
            </div>
        @endforeach
    @else
        <p class="muted">No completed candidate dossiers are available for this role yet.</p>
    @endif

    <div class="footer">
        Certalytic- EU-sovereign interview integrity decision support. This dossier is for internal hiring review only.
    </div>
</body>
</html>
