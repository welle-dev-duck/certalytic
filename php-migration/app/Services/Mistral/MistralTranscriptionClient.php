<?php

namespace App\Services\Mistral;

use App\Services\TranscriptFormatter;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MistralTranscriptionClient
{
    public function __construct(private TranscriptFormatter $formatter) {}

    /**
     * @return array{
     *     text: string,
     *     duration_seconds: ?int,
     *     segments: list<array{speaker_id: string, text: string, start: ?float, end: ?float}>,
     *     speaker_labels: array<string, string>
     * }
     */
    public function transcribe(string $absoluteAudioPath, string $fileName): array
    {
        try {
            $response = Http::baseUrl(config('certalytic.mistral.base_url'))
                ->withToken(config('certalytic.mistral.api_key'))
                ->acceptJson()
                ->timeout((int) config('certalytic.mistral.transcription_timeout', 600))
                ->attach('file', fopen($absoluteAudioPath, 'r'), $fileName)
                ->post('/audio/transcriptions', [
                    'model' => config('certalytic.mistral.transcription_model'),
                    'diarize' => 'true',
                    'timestamp_granularities' => 'segment',
                ])
                ->throw();

            /** @var array<string, mixed> $json */
            $json = $response->json();

            return $this->formatResponse($json);
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Mistral transcription request failed: '.$exception->getMessage(),
                previous: $exception,
            );
        }
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array{
     *     text: string,
     *     duration_seconds: ?int,
     *     segments: list<array{speaker_id: string, text: string, start: ?float, end: ?float}>,
     *     speaker_labels: array<string, string>
     * }
     */
    private function formatResponse(array $response): array
    {
        $durationSeconds = is_numeric($response['duration'] ?? null) ? (int) $response['duration'] : null;
        $segments = $this->formatter->normalizeSegments(
            is_array($response['segments'] ?? null) ? $response['segments'] : [],
        );

        if ($segments !== []) {
            $speakerLabels = $this->formatter->buildDefaultSpeakerLabels($segments);

            return [
                'text' => $this->formatter->formatSegments($segments, $speakerLabels),
                'duration_seconds' => $durationSeconds,
                'segments' => $segments,
                'speaker_labels' => $speakerLabels,
            ];
        }

        $plainText = is_string($response['text'] ?? null) ? trim($response['text']) : '';

        if ($plainText !== '') {
            $fallbackSegment = [
                'speaker_id' => 'speaker_0',
                'text' => $plainText,
                'start' => null,
                'end' => null,
            ];
            $speakerLabels = ['speaker_0' => 'Speaker 1'];

            return [
                'text' => $this->formatter->formatSegments([$fallbackSegment], $speakerLabels),
                'duration_seconds' => $durationSeconds,
                'segments' => [$fallbackSegment],
                'speaker_labels' => $speakerLabels,
            ];
        }

        throw new RuntimeException('Mistral transcription returned no text.');
    }
}
