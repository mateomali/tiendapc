<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/CategoriesPage', [
            'categories' => $categories
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'image_url' => $category->image_url,
                    'group_key' => $category->group_key,
                    'sort_order' => $category->sort_order,
                    'is_hidden' => $category->is_hidden,
                    'product_count' => $category->products_count,
                ]),
            'groupOptions' => $categories
                ->pluck('group_key')
                ->filter()
                ->unique()
                ->values()
                ->map(fn (string $groupKey): array => [
                    'key' => $groupKey,
                    'label' => strtoupper($groupKey),
                ]),
            'stats' => [
                'total' => $categories->count(),
                'hidden' => $categories->where('is_hidden', true)->count(),
                'withProducts' => $categories->where('products_count', '>', 0)->count(),
                'withoutProducts' => $categories->where('products_count', 0)->count(),
            ],
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        $payload = $request->validated();
        $payload['slug'] = Str::slug($payload['name']);
        $payload['is_hidden'] = (bool) ($payload['is_hidden'] ?? false);
        $payload['sort_order'] = (int) ($payload['sort_order'] ?? (Category::query()->max('sort_order') + 1));

        Category::query()->create($payload);

        return back()->with('success', 'Categoria creada.');
    }

    public function update(CategoryRequest $request, Category $category): RedirectResponse
    {
        $payload = $request->validated();
        $payload['slug'] = Str::slug($payload['name']);
        $payload['is_hidden'] = (bool) ($payload['is_hidden'] ?? false);
        $category->update($payload);

        return back()->with('success', 'Categoria actualizada.');
    }

    public function toggleVisibility(Category $category): RedirectResponse
    {
        $category->update(['is_hidden' => ! $category->is_hidden]);

        return back()->with('success', 'Visibilidad actualizada.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['integer', 'exists:categories,id'],
        ]);

        foreach ($validated['ordered_ids'] as $index => $id) {
            Category::query()->whereKey($id)->update(['sort_order' => $index + 1]);
        }

        return back()->with('success', 'Categorias reordenadas.');
    }

    public function merge(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'source_id' => ['required', 'integer', 'exists:categories,id'],
            'target_id' => ['required', 'integer', 'exists:categories,id', 'different:source_id'],
        ]);

        Category::query()->findOrFail($validated['source_id'])
            ->products()
            ->update(['category_id' => $validated['target_id']]);

        Category::query()->findOrFail($validated['source_id'])->delete();

        return back()->with('success', 'Categorias fusionadas.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            return back()->with('error', 'No podes eliminar una categoria con productos asociados.');
        }

        $category->delete();

        return back()->with('success', 'Categoria movida a papelera.');
    }
}
