<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;

class CartService
{
    private const SESSION_KEY = 'cart.items';

    public function items(): array
    {
        /** @var array<int, array{product_id:int, quantity:int}> $items */
        $items = Session::get(self::SESSION_KEY, []);

        if ($items === []) {
            return [];
        }

        $products = Product::query()
            ->with('category')
            ->whereIn('id', array_column($items, 'product_id'))
            ->get()
            ->keyBy('id');

        return Collection::make($items)
            ->map(function (array $item) use ($products): ?array {
                /** @var Product|null $product */
                $product = $products->get($item['product_id']);

                if ($product === null) {
                    return null;
                }

                $quantity = max(1, (int) $item['quantity']);
                $unitPrice = $product->effectivePrice();

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image_url' => $product->image_url,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $unitPrice * $quantity,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    public function count(): int
    {
        return Collection::make(Session::get(self::SESSION_KEY, []))
            ->sum(fn (array $item): int => max(1, (int) ($item['quantity'] ?? 1)));
    }

    public function total(): int
    {
        return Collection::make($this->items())->sum('subtotal');
    }

    public function add(Product $product, int $quantity = 1): void
    {
        $items = Session::get(self::SESSION_KEY, []);
        $quantity = max(1, $quantity);

        foreach ($items as &$item) {
            if ((int) $item['product_id'] === $product->id) {
                $item['quantity'] = max(1, (int) $item['quantity']) + $quantity;
                Session::put(self::SESSION_KEY, $items);
                return;
            }
        }

        $items[] = [
            'product_id' => $product->id,
            'quantity' => $quantity,
        ];

        Session::put(self::SESSION_KEY, $items);
    }

    public function update(int $productId, int $quantity): void
    {
        $items = Session::get(self::SESSION_KEY, []);

        foreach ($items as $index => $item) {
            if ((int) $item['product_id'] !== $productId) {
                continue;
            }

            if ($quantity <= 0) {
                unset($items[$index]);
            } else {
                $items[$index]['quantity'] = $quantity;
            }

            Session::put(self::SESSION_KEY, array_values($items));
            return;
        }
    }

    public function remove(int $productId): void
    {
        $items = array_values(array_filter(
            Session::get(self::SESSION_KEY, []),
            fn (array $item): bool => (int) $item['product_id'] !== $productId,
        ));

        Session::put(self::SESSION_KEY, $items);
    }

    public function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }
}
