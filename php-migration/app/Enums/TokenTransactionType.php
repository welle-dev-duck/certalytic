<?php

namespace App\Enums;

enum TokenTransactionType: string
{
    case Included = 'included';
    case Pack = 'pack';
    case Refund = 'refund';
    case PackCredit = 'pack_credit';
}
