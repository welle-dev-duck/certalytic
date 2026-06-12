<?php

namespace App\Http\Requests\Candidates;

use App\Services\TokenService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class BulkImportRequest extends FormRequest
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
            'csv' => ['nullable', File::types(['csv', 'txt'])->max(2048)],
            'cvs' => ['nullable', 'array'],
            'cvs.*' => [File::types(['pdf'])->max(10240)],
            'transcripts' => ['nullable', 'array'],
            'transcripts.*' => ['string', 'min:10'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (! $this->hasFile('csv') && ! $this->hasFile('cvs')) {
                $validator->errors()->add('csv', 'Provide a CSV file or upload CV PDFs.');
            }

            $team = $this->user()?->currentTeam;

            if ($team === null) {
                return;
            }

            if (! app(TokenService::class)->canConsume($team)) {
                $validator->errors()->add('tokens', 'Insufficient tokens to import candidates.');
            }
        });
    }
}
