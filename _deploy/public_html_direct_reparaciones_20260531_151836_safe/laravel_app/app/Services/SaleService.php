<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function create(array $items, ?int $createdByUserId = null, string $customerLabel = 'Consumidor final', ?string $notes = null): Sale
    {
        return DB::transaction(function () use ($items, $createdByUserId, $customerLabel, $notes): Sale {
            $ticketNumber = $this->nextTicketNumber();
            $normalizedItems = [];
            $subtotal = 0;

            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $quantity = max(1, (int) ($item['quantity'] ?? 1));
                $manualName = trim((string) ($item['manual_name'] ?? ''));
                $unitPrice = max(0, (int) ($item['unit_price'] ?? 0));

                $product = $productId > 0 ? Product::query()->find($productId) : null;

                $normalizedItems[] = [
                    'product_id' => $product?->id,
                    'product_name_snapshot' => $product?->name ?? $manualName,
                    'product_sku_snapshot' => $product?->sku,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $unitPrice * $quantity,
                ];

                $subtotal += $unitPrice * $quantity;
            }

            $sale = Sale::query()->create([
                'ticket_number' => $ticketNumber,
                'customer_label' => trim($customerLabel) !== '' ? $customerLabel : 'Consumidor final',
                'issued_at' => now(),
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'notes' => $notes,
                'created_by_user_id' => $createdByUserId,
            ]);

            $sale->items()->createMany($normalizedItems);

            return $sale->load('items');
        });
    }

    public function delete(Sale $sale): void
    {
        DB::transaction(function () use ($sale): void {
            $sale->items()->delete();
            $sale->delete();
        });
    }

    private function nextTicketNumber(): int
    {
        return ((int) Sale::query()->max('ticket_number')) + 1;
    }
}
