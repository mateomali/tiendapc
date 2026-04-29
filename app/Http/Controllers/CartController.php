<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function add(Request $request, CartService $cartService): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        /** @var Product $product */
        $product = Product::query()->where('is_active', true)->findOrFail($validated['product_id']);
        $cartService->add($product, (int) ($validated['quantity'] ?? 1));

        return back()->with('success', 'Producto agregado al carrito.');
    }

    public function update(Request $request, CartService $cartService): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer'],
        ]);

        $cartService->update((int) $validated['product_id'], (int) $validated['quantity']);

        return back()->with('success', 'Carrito actualizado.');
    }

    public function remove(Request $request, CartService $cartService): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
        ]);

        $cartService->remove((int) $validated['product_id']);

        return back()->with('success', 'Producto eliminado del carrito.');
    }

    public function clear(CartService $cartService): RedirectResponse
    {
        $cartService->clear();

        return back()->with('success', 'Carrito vaciado.');
    }
}
