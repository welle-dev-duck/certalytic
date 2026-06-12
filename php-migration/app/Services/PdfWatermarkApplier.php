<?php

namespace App\Services;

use Barryvdh\DomPDF\PDF;

class PdfWatermarkApplier
{
    public function apply(PDF $pdf, bool $prominent): void
    {
        $pdf->render();

        $dompdf = $pdf->getDomPDF();
        $canvas = $dompdf->getCanvas();
        $fontMetrics = $dompdf->getFontMetrics();
        $font = $fontMetrics->getFont('helvetica', 'bold');
        $opacity = $prominent ? 0.14 : 0.08;

        $canvas->page_script(function ($pageNumber, $pageCount, $canvas) use ($font, $opacity): void {
            $width = $canvas->get_width();
            $height = $canvas->get_height();
            $canvas->set_opacity($opacity);
            $canvas->text(
                $width / 2 - 140,
                $height / 2,
                'CERTALYTIC',
                $font,
                48,
                [0.18, 0.36, 0.33],
                0,
                0,
                -45,
            );
            $canvas->set_opacity(1);
        });
    }
}
