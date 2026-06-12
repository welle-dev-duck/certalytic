<?php

namespace App\Http\Requests\Teams;

use App\Rules\TeamName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SaveTeamRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', new TeamName],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter a team name.',
            'name.max' => 'Team name must not exceed 255 characters.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();

            if ($user === null) {
                return;
            }

            if ($user->nonPersonalTeamsCount() >= config('certalytic.max_teams_per_user')) {
                $validator->errors()->add(
                    'name',
                    'You can belong to at most '.config('certalytic.max_teams_per_user').' teams.',
                );
            }
        });
    }
}
