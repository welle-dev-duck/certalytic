<?php

namespace App\Models;

use App\Enums\RoleExportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleExport extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'team_id',
        'role_id',
        'user_id',
        'status',
        'path',
        'error_message',
        'completed_at',
    ];

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isInProgress(): bool
    {
        return in_array($this->status, [RoleExportStatus::Pending, RoleExportStatus::Processing], true);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RoleExportStatus::class,
            'completed_at' => 'datetime',
        ];
    }
}
