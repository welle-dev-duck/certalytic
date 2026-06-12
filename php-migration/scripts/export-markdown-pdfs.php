<?php

declare(strict_types=1);

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Console\Kernel;
use League\CommonMark\GithubFlavoredMarkdownConverter;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$exports = [
    'product-overview.md' => ['product-overview.pdf', 'Certalytic — Product & Engineering Overview'],
    'product-pitch.md' => ['product-pitch.pdf', 'Certalytic — Product Pitch'],
    'linkedin-outreach.md' => ['linkedin-outreach.pdf', 'Certalytic — LinkedIn Outreach'],
];

$outputDirectory = __DIR__.'/../docs/pdf';

$converter = new GithubFlavoredMarkdownConverter([
    'html_input' => 'strip',
    'allow_unsafe_links' => false,
]);

foreach ($exports as $source => [$target, $title]) {
    $sourcePath = __DIR__.'/../'.$source;
    $targetPath = $outputDirectory.'/'.$target;

    if (! is_file($sourcePath)) {
        fwrite(STDERR, "Missing source file: {$source}\n");
        exit(1);
    }

    $markdown = file_get_contents($sourcePath);

    if ($markdown === false) {
        fwrite(STDERR, "Could not read: {$source}\n");
        exit(1);
    }

    $content = $converter->convert(normalizeMathBlocks($markdown))->getContent();

    Pdf::loadView('pdf.markdown-document', [
        'title' => $title,
        'content' => $content,
    ])
        ->setPaper('a4')
        ->save($targetPath);

    echo "Wrote {$targetPath}\n";
}

function normalizeMathBlocks(string $markdown): string
{
    return (string) preg_replace_callback(
        '/\$\$([^$]+)\$\$/s',
        static function (array $matches): string {
            $formula = trim($matches[1]);
            $formula = str_replace(['\\text{', '}', '\\times'], ['', '', '×'], $formula);

            return "\n\n**{$formula}**\n\n";
        },
        $markdown,
    );
}
