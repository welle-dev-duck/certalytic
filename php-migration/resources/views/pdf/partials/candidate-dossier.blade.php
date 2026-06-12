<div class="score-box">
    <div class="muted" style="font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase;">Hiring integrity score</div>
    <div class="score-value">{{ number_format((float) $report['score'], 1) }}</div>
    <div class="muted">Risk level: {{ ucfirst($report['level']) }}</div>
</div>

<table class="meta-table">
    <tr>
        <td class="meta-label">Email</td>
        <td>{{ $candidate->email ?? '—' }}</td>
    </tr>
    <tr>
        <td class="meta-label">Screening completed</td>
        <td>{{ $candidate->processed_at?->timezone('UTC')->format('j M Y, H:i') ?? '—' }} UTC</td>
    </tr>
    <tr>
        <td class="meta-label">Active flags</td>
        <td>{{ count($report['flags']) }}</td>
    </tr>
    <tr>
        <td class="meta-label">Interview rounds</td>
        <td>{{ count($report['rounds']) }}</td>
    </tr>
</table>

<h2>Integrity signal breakdown</h2>
@php
    $components = [
        's_cv' => ['label' => 'CV authenticity', 'weight' => '25%'],
        's_int' => ['label' => 'Interview behavioral', 'weight' => '50%'],
        's_cross' => ['label' => 'Cross-source consistency', 'weight' => '15%'],
        's_id' => ['label' => 'Identity confidence', 'weight' => '10%'],
    ];
@endphp

@foreach ($components as $key => $component)
    @php
        $rawValue = $report['subScores'][$key] ?? null;
        $evaluated = $rawValue !== null;
        $value = $evaluated ? (int) $rawValue : 0;
        $weightLabel = ($key === 's_cross' && ! ($report['crossSourceEvaluated'] ?? true))
            ? 'excluded'
            : $component['weight'];
    @endphp
    <div class="metric">
        <table class="metric-row">
            <tr>
                <td style="width: 42%;">{{ $component['label'] }} ({{ $weightLabel }})</td>
                <td style="width: 10%; text-align: right; font-weight: 700;">{{ $evaluated ? "{$value}/100" : 'Not evaluated' }}</td>
                <td style="width: 48%; padding-left: 10px;">
                    @if ($evaluated)
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {{ $value }}%;"></div>
                        </div>
                    @endif
                </td>
            </tr>
        </table>
        <p class="muted" style="margin: 4px 0 0;">{{ $report['componentSummaries'][$key] ?? '' }}</p>
        @if ($showFullBreakdown && ! empty($report['componentIndicators'][$key]))
            <ul>
                @foreach ($report['componentIndicators'][$key] as $indicator)
                    <li>{{ $indicator }}</li>
                @endforeach
            </ul>
        @endif
    </div>
@endforeach

@if (count($report['flags']) > 0)
    <h2>Active flags ({{ count($report['flags']) }})</h2>
    @foreach ($report['flags'] as $flag)
        <div class="flag">
            <div class="flag-type">{{ str_replace('_', ' ', $flag['type']) }} · {{ (int) round(($flag['confidence'] ?? 0) * 100) }}% confidence</div>
            <div>{{ $flag['description'] }}</div>
        </div>
    @endforeach
@endif

<h2>AI verdict</h2>
<p><strong>{{ $report['verdict']['title'] ?? '' }}</strong></p>
<p class="muted">{{ $report['verdict']['body'] ?? '' }}</p>

@if (! empty($report['recommendedActions']))
    <h2>Recommended follow-ups</h2>
    <ul>
        @foreach ($report['recommendedActions'] as $action)
            <li>{{ $action }}</li>
        @endforeach
    </ul>
@endif

@if (! empty($behaviourAnalysis) || ! empty($personalityAnalysis))
    @include('pdf.partials.supplementary-analyses', [
        'behaviourAnalysis' => $behaviourAnalysis ?? [],
        'personalityAnalysis' => $personalityAnalysis ?? [],
    ])
@endif

@if (count($report['rounds']) > 0)
    <h2>Interview rounds</h2>
    @foreach ($report['rounds'] as $round)
        <div class="flag">
            <div class="flag-type">Round {{ $round['round_number'] }} · Interview score {{ $round['s_int'] ?? '—' }}</div>
            @if (! empty($round['observations']))
                <ul>
                    @foreach ($round['observations'] as $observation)
                        <li>{{ $observation }}</li>
                    @endforeach
                </ul>
            @endif
        </div>
    @endforeach
@endif
