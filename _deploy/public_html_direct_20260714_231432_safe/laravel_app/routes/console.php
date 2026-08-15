<?php

use App\Services\LegacyImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('tienda:import-legacy', function (LegacyImportService $importService) {
    $report = $importService->importAll();

    $this->info('Legacy import completed.');

    foreach ($report['tables'] as $row) {
        $this->line(sprintf(' - %s: %s', $row['name'], (string) $row['imported']));
    }

    foreach ($report['assets'] as $asset) {
        $this->line(sprintf(
            ' - assets %s -> %s [%s]',
            $asset['from'],
            $asset['to'],
            $asset['copied'] ? 'copied' : 'skipped'
        ));
    }
})->purpose('Import data and assets from the legacy Tienda Abril project');
