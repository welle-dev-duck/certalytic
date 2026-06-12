<?php

namespace App\Http\Requests\Roles;

use App\Models\Role;
use App\Services\PlanFeatures;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreRoleDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Role $role */
        $role = $this->route('role');

        return $this->user()?->belongsToTeam($role->team) === true
            && app(PlanFeatures::class)->can($role->team, 'role_context_assets');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document' => [
                'required',
                File::types(['pdf', 'doc', 'docx', 'md', 'markdown', 'txt'])->max(10240),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Role $role */
            $role = $this->route('role');
            $planFeatures = app(PlanFeatures::class);
            $maxDocuments = $planFeatures->maxRoleDocuments($role->team);

            if ($role->documents()->count() >= $maxDocuments) {
                $validator->errors()->add(
                    'document',
                    "This plan allows a maximum of {$maxDocuments} targeted scan asset(s) per role.",
                );
            }
        });
    }
}
