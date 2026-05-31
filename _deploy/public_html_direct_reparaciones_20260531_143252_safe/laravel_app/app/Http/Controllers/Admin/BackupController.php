<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\BinaryFileResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;
use Inertia\Inertia;
use Inertia\Response;

class BackupController extends Controller
{
    public function index(BackupService $backupService): Response
    {
        $backups = $backupService->list();

        return Inertia::render('Admin/BackupsPage', [
            'backups' => $backups,
            'stats' => [
                'total' => count($backups),
                'totalSizeLabel' => number_format(array_sum(array_column($backups, 'size')) / 1024, 1, ',', '.') . ' KB',
                'latestCreatedAt' => $backups[0]['created_at'] ?? null,
            ],
        ]);
    }

    public function create(BackupService $backupService): RedirectResponse
    {
        try {
            $fileName = $backupService->create();
        } catch (Throwable $exception) {
            return back()->with('error', $exception->getMessage() !== '' ? $exception->getMessage() : 'No se pudo crear el backup.');
        }

        return back()->with('success', 'Backup creado: ' . $fileName);
    }

    public function restore(Request $request, BackupService $backupService): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['nullable', 'string'],
            'backup_zip' => ['nullable', 'file', 'max:307200', 'mimes:zip'],
        ]);

        $selectedFile = trim((string) ($validated['file'] ?? ''));
        $uploadedBackup = $request->file('backup_zip');

        if ($selectedFile === '' && $uploadedBackup === null) {
            return back()->with('error', 'Debes seleccionar o subir un backup ZIP.');
        }

        try {
            if ($uploadedBackup !== null) {
                $fileName = $backupService->storeUploadedBackup($uploadedBackup);
                $backupService->restore($fileName);

                return back()->with('success', 'Backup subido y restaurado correctamente: ' . basename($fileName));
            }

            $backupService->restore($selectedFile);
        } catch (Throwable $exception) {
            return back()->with('error', $exception->getMessage() !== '' ? $exception->getMessage() : 'No se pudo restaurar el backup.');
        }

        return back()->with('success', 'Backup restaurado correctamente.');
    }

    public function delete(string $file, BackupService $backupService): RedirectResponse
    {
        try {
            $backupService->delete($file);
        } catch (Throwable $exception) {
            return back()->with('error', $exception->getMessage() !== '' ? $exception->getMessage() : 'No se pudo eliminar el backup.');
        }

        return back()->with('success', 'Backup eliminado.');
    }

    public function download(string $file): BinaryFileResponse
    {
        return response()->download(public_path(config('tienda.uploads.backups') . DIRECTORY_SEPARATOR . basename($file)));
    }
}
