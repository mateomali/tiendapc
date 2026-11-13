<?php

use App\Models\RepairOrder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

beforeEach(function (): void {
    $this->uploadPath = 'uploads/test_' . Str::random(16);
    config(['tienda.uploads.repairs' => $this->uploadPath, 'tienda.uploads.repairs_thumbnails' => $this->uploadPath . '/thumbnails']);
});

afterEach(function (): void {
    File::deleteDirectory(public_path($this->uploadPath));
});

function intakeTestPhoto(): UploadedFile
{
    return UploadedFile::fake()->createWithContent('equipo.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
}

it('verifies stored photos and redirects the saved order to consultations', function (): void {
    $photo = intakeTestPhoto();
    $hash = hash_file('sha256', $photo->getPathname());
    $this->withSession(['repair_tech_authenticated' => true])->post(route('repairs.orders.store'), [
        'nombre_cliente' => 'Cliente foto',
        'jobs' => [['modelo' => 'Equipo prueba', 'descripcion' => 'Revision', 'monto' => 1000, 'images' => [$photo]]],
    ])->assertSessionHasNoErrors()->assertRedirect(route('repairs.workbench'));
    $order = RepairOrder::query()->firstOrFail();
    expect($order->originalImages())->toHaveCount(1);
    $filename = $order->originalImages()[0];
    foreach ([$this->uploadPath . '/' . $filename, $this->uploadPath . '/thumbnails/thumb_' . $filename] as $path) {
        expect(is_file(public_path($path)))->toBeTrue();
        expect(hash_file('sha256', public_path($path)))->toBe($hash);
    }
});

it('does not save the order when the thumbnail write fails or is corrupted', function (bool $corrupt): void {
    File::partialMock()->shouldReceive('copy')->once()->andReturnUsing(function (string $source, string $destination) use ($corrupt): bool {
        if ($corrupt) file_put_contents($destination, 'incomplete photo');
        return $corrupt;
    });
    $this->withSession(['repair_tech_authenticated' => true])->from(route('repairs.ingress'))->post(route('repairs.orders.store'), [
        'nombre_cliente' => 'Cliente error foto',
        'jobs' => [['modelo' => 'Equipo prueba', 'descripcion' => 'Revision', 'monto' => 1000, 'images' => [intakeTestPhoto()]]],
    ])->assertRedirect(route('repairs.ingress'))->assertSessionHasErrors('save');
    expect(RepairOrder::query()->count())->toBe(0);
    expect(array_filter(File::allFiles(public_path($this->uploadPath)), fn ($file) => is_file($file->getPathname())))->toBeEmpty();
})->with([false, true]);
