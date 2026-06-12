<?php

namespace App\Http\Requests\Tools;

use App\Models\Team;
use App\Services\TranscriptTokenService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreTranscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->currentTeam !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'audio' => [
                'required',
                File::types(['mp3', 'm4a', 'wav'])->max(config('certalytic.limits.audio_max_kilobytes')),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Team|null $team */
            $team = $this->user()?->currentTeam;

            if ($team === null) {
                return;
            }

            if (! app(TranscriptTokenService::class)->canConsume($team)) {
                $validator->errors()->add('audio', 'Insufficient transcription tokens. Purchase a token pack first.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $maxMinutes = config('certalytic.limits.audio_max_duration_minutes');
        $maxMb = (int) round(config('certalytic.limits.audio_max_kilobytes') / 1024);

        return [
            'audio.required' => 'Upload an audio file to transcribe.',
            'audio.max' => "Audio file must not exceed {$maxMb} MB (approximately {$maxMinutes} minutes).",
        ];
    }
}
