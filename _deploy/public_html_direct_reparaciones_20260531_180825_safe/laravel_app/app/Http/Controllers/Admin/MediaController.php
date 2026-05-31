<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MediaAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:180'],
            'tag' => ['nullable', 'string', 'max:120'],
        ]);

        $mediaQuery = MediaAsset::query()->latest();
        $search = trim((string) ($filters['q'] ?? ''));
        $tag = trim((string) ($filters['tag'] ?? ''));

        if ($search !== '') {
            $mediaQuery->where(function ($query) use ($search): void {
                $query
                    ->where('title', 'like', '%' . $search . '%')
                    ->orWhere('tags', 'like', '%' . $search . '%')
                    ->orWhere('file_url', 'like', '%' . $search . '%');
            });
        }

        if ($tag !== '') {
            $mediaQuery->where('tags', 'like', '%' . $tag . '%');
        }

        $media = $mediaQuery->get();
        $tagsCloud = [];

        foreach ($media as $item) {
            foreach (preg_split('/[,;]+/', (string) $item->tags) ?: [] as $singleTag) {
                $cleanTag = trim((string) $singleTag);

                if ($cleanTag === '') {
                    continue;
                }

                $tagsCloud[$cleanTag] = ($tagsCloud[$cleanTag] ?? 0) + 1;
            }
        }

        ksort($tagsCloud, SORT_NATURAL | SORT_FLAG_CASE);

        return Inertia::render('Admin/MediaPage', [
            'filters' => [
                'q' => $search,
                'tag' => $tag,
            ],
            'media' => $media->map(fn (MediaAsset $item): array => [
                'id' => $item->id,
                'title' => $item->title,
                'file_url' => $item->file_url,
                'tags' => $item->tags,
                'mime_type' => $item->mime_type,
                'file_size' => $item->file_size,
                'file_size_label' => number_format(((int) $item->file_size) / 1024, 1, ',', '.') . ' KB',
                'dimensions_label' => $item->width && $item->height ? $item->width . ' x ' . $item->height : 'Sin medidas',
                'created_at_label' => optional($item->created_at)->format('d/m/Y H:i') ?? '-',
                'is_image' => Str::startsWith((string) $item->mime_type, 'image/'),
            ]),
            'tagsCloud' => collect($tagsCloud)->map(
                fn (int $count, string $name): array => ['name' => $name, 'count' => $count],
            )->values()->all(),
            'stats' => [
                'total' => $media->count(),
                'images' => $media->filter(
                    fn (MediaAsset $item): bool => Str::startsWith((string) $item->mime_type, 'image/'),
                )->count(),
                'tags' => count($tagsCloud),
                'totalSizeLabel' => number_format($media->sum('file_size') / 1024, 1, ',', '.') . ' KB',
            ],
        ]);
    }

    public function upload(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:180'],
            'file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'tags' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $media = $this->storeUploadedMedia(
                $validated['file'],
                $validated['title'] ?? null,
                $validated['tags'] ?? null,
            );
        } catch (Throwable $exception) {
            Log::error('Media upload failed.', [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            if ($request->expectsJson() || $request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No se pudo subir la imagen. Revisa permisos de assets/uploads/library y la tabla media_library.',
                ], 500);
            }

            return back()->with('error', 'No se pudo subir la imagen. Revisa permisos de assets/uploads/library y la tabla media_library.');
        }

        if ($request->expectsJson() || $request->wantsJson() || $request->ajax()) {
            return response()->json([
                'ok' => true,
                'message' => 'Archivo subido.',
                'media' => $this->serializeMedia($media),
            ]);
        }

        return back()->with('success', 'Archivo subido.');
    }

    private function storeUploadedMedia(UploadedFile $file, ?string $title, ?string $tags): MediaAsset
    {
        $directory = public_path((string) config('tienda.uploads.library'));
        File::ensureDirectoryExists($directory, 0755, true);

        if (! is_dir($directory) || ! is_writable($directory)) {
            throw new \RuntimeException("Upload directory is not writable: {$directory}");
        }

        $extension = $file->getClientOriginalExtension() !== ''
            ? $file->getClientOriginalExtension()
            : ($file->extension() ?: 'jpg');
        $filename = uniqid('media_', true) . '.' . Str::lower($extension);
        $mimeType = $file->getMimeType();
        $fileSize = $file->getSize();
        $file->move($directory, $filename);
        $dimensions = @getimagesize($directory . DIRECTORY_SEPARATOR . $filename);

        return MediaAsset::query()->create([
            'title' => trim((string) $title) !== '' ? trim((string) $title) : $file->getClientOriginalName(),
            'file_url' => '/' . trim(config('tienda.uploads.library') . '/' . $filename, '/'),
            'tags' => $this->normalizeTags($tags),
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'width' => is_array($dimensions) ? (int) ($dimensions[0] ?? 0) : null,
            'height' => is_array($dimensions) ? (int) ($dimensions[1] ?? 0) : null,
        ]);
    }

    private function serializeMedia(MediaAsset $media): array
    {
        return [
            'id' => $media->id,
            'title' => $media->title,
            'tags' => $media->tags,
            'fileUrl' => $media->file_url,
            'file_url' => $media->file_url,
        ];
    }

    public function destroy(MediaAsset $media): RedirectResponse
    {
        $path = public_path(ltrim($media->file_url, '/'));
        if (File::exists($path)) {
            File::delete($path);
        }

        $media->delete();

        return back()->with('success', 'Archivo eliminado.');
    }

    private function normalizeTags(?string $tags): ?string
    {
        $parts = preg_split('/[,;\n\r]+/', (string) $tags) ?: [];
        $normalized = collect($parts)
            ->map(fn (string $tag): string => trim($tag))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $normalized === [] ? null : implode(', ', $normalized);
    }
}
