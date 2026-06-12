<?php

namespace App\Enums;

enum RoleDocumentStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Complete = 'complete';
    case Failed = 'failed';
}
