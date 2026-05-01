<?php

namespace App\Services;

use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use Illuminate\Http\Request;

class SiteViewDataService
{
    /**
     * @return array{
     *   brandUrl: string,
     *   logoUrl: string,
     *   logoFallbackUrl: string,
     *   navItems: array<int, array{label: string, href: string, isActive: bool}>,
     *   cartUrl: string,
     *   repairUrl: string,
     *   footer: array{
     *     address: string,
     *     hours: string,
     *     mapUrl: string,
     *     ctaTitle: string,
     *     ctaText: string,
     *     whatsappDisplay: string,
     *     whatsappUrl: string,
     *     copyrightYear: int
     *   }
     * }
     */
    public function layout(Request $request): array
    {
        $repairUrl = '/reparaciones';
        $whatsappNumber = $this->contactWhatsapp();
        $whatsappDisplay = $this->formatWhatsappDisplay($whatsappNumber);

        $isCatalog = $request->routeIs('store.catalog');
        $offersActive = $isCatalog && $this->isTruthy($request->query('ofertas'));
        $newActive = $isCatalog && $this->isTruthy($request->query('novedades'));
        $productsActive = $isCatalog && !$offersActive && !$newActive;

        return [
            'brandUrl' => route('store.catalog'),
            'logoUrl' => asset('assets/img/header-sudoku.png'),
            'logoFallbackUrl' => asset('assets/img/header-placeholder.svg'),
            'navItems' => [
                [
                    'label' => 'PRODUCTOS',
                    'href' => route('store.catalog'),
                    'isActive' => $productsActive,
                ],
                [
                    'label' => 'OFERTAS',
                    'href' => route('store.catalog', ['ofertas' => 1]),
                    'isActive' => $offersActive,
                ],
                [
                    'label' => 'NOVEDADES',
                    'href' => route('store.catalog', ['novedades' => 1]),
                    'isActive' => $newActive,
                ],
                [
                    'label' => 'SERVICIOS',
                    'href' => route('store.services'),
                    'isActive' => $request->routeIs('store.services'),
                ],
            ],
            'cartUrl' => route('store.cart'),
            'repairUrl' => $repairUrl,
            'footer' => [
                'address' => $this->value('footer_address', 'Av. Jose de San Martin 2658, Parque San Martin, Merlo'),
                'hours' => $this->value('footer_hours', 'Lunes a sabados de 10:30 a 13:30 y 17:00 a 20:30'),
                'mapUrl' => $this->value('footer_map_url', 'https://maps.google.com/maps?q=sudoku%20merlo&t=m&z=13&output=embed&iwloc=near'),
                'ctaTitle' => $this->value('footer_cta_title', 'Queres consultar algo?'),
                'ctaText' => $this->value('footer_cta_text', 'Escribinos por WhatsApp:'),
                'whatsappDisplay' => $whatsappDisplay,
                'whatsappUrl' => $this->buildWhatsappUrl($whatsappNumber, 'Hola Sudoku, quiero hacer una consulta.'),
                'copyrightYear' => (int) date('Y'),
            ],
        ];
    }

    private function contactWhatsapp(): string
    {
        $contact = SiteContactConfig::query()->find(1);
        $number = (string) ($contact?->whatsapp_number ?: SiteGlobalConfig::value('whatsapp_number', config('tienda.whatsapp_number')));

        return preg_replace('/\D+/', '', $number) ?: config('tienda.whatsapp_number');
    }

    private function value(string $key, string $default): string
    {
        return (string) (SiteGlobalConfig::value($key, $default) ?? $default);
    }

    private function safeRouteConfigValue(string $key, string $default): string
    {
        $value = trim((string) (SiteGlobalConfig::value($key, $default) ?? $default));

        if ($value === '') {
            return $default;
        }

        $normalizedRepair = $this->normalizeRepairUrl($value, $default);

        return $normalizedRepair !== '' ? $normalizedRepair : $default;
    }

    private function normalizeRepairUrl(string $value, string $default): string
    {
        $path = strtolower(trim((string) parse_url($value, PHP_URL_PATH)));

        if (in_array($path, ['/reparacion', '/reparacion.php', 'reparacion', 'reparacion.php'], true)) {
            return $default;
        }

        return $value;
    }

    private function formatWhatsappDisplay(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (strlen($value) === 12 && str_starts_with($value, '54')) {
            return '+' . substr($value, 0, 2) . ' ' . substr($value, 2, 2) . ' ' . substr($value, 4, 4) . '-' . substr($value, 8);
        }

        return '+' . $value;
    }

    private function buildWhatsappUrl(string $number, string $message): string
    {
        return 'https://wa.me/' . $number . '?text=' . rawurlencode($message);
    }

    private function isTruthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['1', 'true', 'on', 'yes', 'si'], true);
    }
}
