<?php

namespace App\Enums;

enum RoleExportStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Complete = 'complete';
    case Failed = 'failed';
}
