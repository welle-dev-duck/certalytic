<?php

namespace App\Enums;

enum CandidateStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Complete = 'complete';
    case Failed = 'failed';
}
