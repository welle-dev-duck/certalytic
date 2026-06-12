<?php

namespace App\Enums;

enum TranscriptionStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Complete = 'complete';
    case Failed = 'failed';
}
