<?php

use App\Models\MediaAsset;
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
