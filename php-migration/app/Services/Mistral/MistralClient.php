<?php

namespace App\Services\Mistral;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MistralClient
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function post(string $endpoint, array $payload): array
    {
        $response = Http::baseUrl(config('certalytic.mistral.base_url'))
            ->withToken(config('certalytic.mistral.api_key'))
            ->acceptJson()
            ->timeout((int) config('certalytic.mistral.timeout', 120))
            ->post($endpoint, $payload)
            ->throw();

        /** @var array<string, mixed> $json */
        $json = $response->json();

        return $json;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function chat(array $payload): array
    {
        try {
            return $this->post('/chat/completions', $payload);
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Mistral chat request failed: '.$exception->getMessage(),
                previous: $exception,
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function ocr(string $base64Pdf): array
    {
        try {
            return $this->post('/ocr', [
                'model' => config('certalytic.mistral.ocr_model'),
                'document' => [
                    'type' => 'document_url',
                    'document_url' => 'data:application/pdf;base64,'.$base64Pdf,
                ],
            ]);
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Mistral OCR request failed: '.$exception->getMessage(),
                previous: $exception,
            );
        }
    }
}
