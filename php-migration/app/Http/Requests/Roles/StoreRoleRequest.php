<?php

namespace App\Http\Requests\Roles;

use App\Services\PlanFeatures;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $team = $this->user()?->currentTeam;

        return $team !== null && app(PlanFeatures::class)->can($team, 'saved_roles');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:'.config('certalytic.limits.role_title_max_characters')],
            'description' => ['nullable', 'string', 'max:'.config('certalytic.limits.role_description_max_characters')],
        ];
    }
}
