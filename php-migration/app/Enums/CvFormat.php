<?php

namespace App\Enums;

enum CvFormat: string
{
    case Pdf = 'pdf';
    case Docx = 'docx';
    case Markdown = 'markdown';
    case Text = 'text';
}
