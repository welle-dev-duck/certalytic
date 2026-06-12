@if (! empty($behaviourAnalysis['summary']) || ! empty($personalityAnalysis['summary']))
    <h2>Supplementary candidate insights</h2>
    <p class="muted" style="font-size: 9pt; margin-bottom: 12px;">
        Behaviour and personality insights are provided for hiring context only. They are not included in the hiring integrity score.
    </p>

    <h3>Candidate behaviour analysis</h3>
    <p>{{ $behaviourAnalysis['summary'] ?? 'Not assessed.' }}</p>
    @if (! empty($behaviourAnalysis['detail']))
        <p><strong>{{ $behaviourAnalysis['detailLabel'] ?? 'Communication style' }}:</strong> {{ $behaviourAnalysis['detail'] }}</p>
    @endif
    @if (! empty($behaviourAnalysis['traits']))
        <ul>
            @foreach ($behaviourAnalysis['traits'] as $trait)
                <li>{{ $trait }}</li>
            @endforeach
        </ul>
    @endif
    @if (! empty($behaviourAnalysis['indicators']))
        <p class="muted"><strong>Collaboration indicators</strong></p>
        <ul>
            @foreach ($behaviourAnalysis['indicators'] as $indicator)
                <li>{{ $indicator }}</li>
            @endforeach
        </ul>
    @endif

    <h3>Candidate personality analysis</h3>
    <p>{{ $personalityAnalysis['summary'] ?? 'Not assessed.' }}</p>
    @if (! empty($personalityAnalysis['detail']))
        <p><strong>{{ $personalityAnalysis['detailLabel'] ?? 'Work style' }}:</strong> {{ $personalityAnalysis['detail'] }}</p>
    @endif
    @if (! empty($personalityAnalysis['traits']))
        <ul>
            @foreach ($personalityAnalysis['traits'] as $trait)
                <li>{{ $trait }}</li>
            @endforeach
        </ul>
    @endif
    @if (! empty($personalityAnalysis['motivationSignals']))
        <p class="muted"><strong>Motivation signals</strong></p>
        <ul>
            @foreach ($personalityAnalysis['motivationSignals'] as $signal)
                <li>{{ $signal }}</li>
            @endforeach
        </ul>
    @endif
    @if (! empty($personalityAnalysis['indicators']))
        <p class="muted"><strong>Culture fit indicators</strong></p>
        <ul>
            @foreach ($personalityAnalysis['indicators'] as $indicator)
                <li>{{ $indicator }}</li>
            @endforeach
        </ul>
    @endif
@endif
