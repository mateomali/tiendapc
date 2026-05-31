<?php

use App\Models\MediaAsset;
use App\Models\RepairOrder;
use App\Models\User;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;

it('renders filtered media library for admin users', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    MediaAsset::query()->create([
        'title' => 'Banner WhatsApp',
        'file_url' => '/assets/uploads/library/banner-whatsapp.webp',
        'tags' => 'banner, whatsapp',
        'mime_type' => 'image/webp',
        'file_size' => 2048,
        'width' => 1200,
        'height' => 1200,
    ]);

    $this->actingAs($user)
        ->get(route('admin.media.index', ['tag' => 'banner']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/MediaPage')
            ->where('filters.tag', 'banner')
            ->has('media', 1)
            ->has('tagsCloud', 2));
});

it('renders backups list for admin users', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    $directory = public_path(config('tienda.uploads.backups'));
    File::ensureDirectoryExists($directory);
    $fileName = 'backup_tienda_test_suite.zip';
    $existingBackups = count(File::files($directory));

    File::put($directory . DIRECTORY_SEPARATOR . $fileName, 'zip');

    try {
        $this->actingAs($user)
            ->get(route('admin.backups.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/BackupsPage')
                ->has('backups', $existingBackups + 1)
                ->where('stats.total', $existingBackups + 1));
    } finally {
        File::delete($directory . DIRECTORY_SEPARATOR . $fileName);
    }
});

it('creates and restores repair-only backups', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);
    $directory = public_path(config('tienda.uploads.backups'));
    File::ensureDirectoryExists($directory);
    $existingRepairBackups = collect(File::files($directory))
        ->map(fn ($file) => $file->getFilename())
        ->filter(fn (string $fileName): bool => str_starts_with($fileName, 'backup_reparaciones_'))
        ->values()
        ->all();

    RepairOrder::query()->create([
        'id' => 7701,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Backup Reparaciones',
        'dni' => 30111222,
        'modelo' => 'A14',
        'descripcion' => 'Revision',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->actingAs($user)
        ->post(route('admin.backups.repairs.create'))
        ->assertRedirect();

    $backup = collect(File::files($directory))
        ->map(fn ($file) => $file->getFilename())
        ->filter(fn (string $fileName): bool => str_starts_with($fileName, 'backup_reparaciones_'))
        ->reject(fn (string $fileName): bool => in_array($fileName, $existingRepairBackups, true))
        ->first();

    expect($backup)->not->toBeNull();

    RepairOrder::query()->where('id', 7701)->delete();
    expect(RepairOrder::query()->where('id', 7701)->exists())->toBeFalse();

    try {
        $this->actingAs($user)
            ->post(route('admin.backups.repairs.restore'), ['file' => $backup])
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        expect(RepairOrder::query()->where('id', 7701)->where('modelo', 'A14')->exists())->toBeTrue();
    } finally {
        if (is_string($backup)) {
            File::delete($directory . DIRECTORY_SEPARATOR . $backup);
        }
    }
});

it('creates and downloads repair-only backups', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);
    $directory = public_path(config('tienda.uploads.backups'));
    File::ensureDirectoryExists($directory);

    $response = $this->actingAs($user)
        ->post(route('admin.backups.repairs.create_download'))
        ->assertOk()
        ->assertDownload();

    $disposition = (string) $response->headers->get('content-disposition');
    preg_match('/filename="?([^";]+)"?/', $disposition, $matches);
    $fileName = $matches[1] ?? null;

    expect($fileName)->toBeString()->toStartWith('backup_reparaciones_');

    File::delete($directory . DIRECTORY_SEPARATOR . $fileName);
});
