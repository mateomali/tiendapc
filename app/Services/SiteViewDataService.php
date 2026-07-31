<?php

namespace App\Services;

use App\Models\Category;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use Illuminate\Support\Carbon;
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
     *   startupNotice: array{
     *     enabled: bool,
     *     title: string,
     *     body: string,
     *     imageUrl: string,
     *     mobileImageUrl: string,
     *     backgroundImageUrl: string,
     *     backgroundColor: string,
     *     textColor: string,
     *     titleSize: int,
     *     bodySize: int,
     *     buttonLabel: string,
     *     buttonUrl: string,
     *     version: string
     *   },
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
            'logoUrl' => asset('assets/img/header-sudoku-ai-relief.png'),
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
            'startupNotice' => $this->startupNotice(),
            'footer' => [
                'address' => $this->value('footer_address', 'Av. Jose de San Martin 2658, Parque San Martin, Merlo'),
                'hours' => $this->value('footer_hours', 'Lunes a viernes de 10:30 a 13:30 y 17:00 a 20:30 | Sábados 17:00 a 20:30'),
                'mapUrl' => $this->value('footer_map_url', 'https://maps.google.com/maps?q=sudoku%20merlo&t=m&z=13&output=embed&iwloc=near'),
                'ctaTitle' => $this->value('footer_cta_title', 'Queres consultar algo?'),
                'ctaText' => $this->value('footer_cta_text', 'Escribinos por WhatsApp:'),
                'whatsappDisplay' => $whatsappDisplay,
                'whatsappUrl' => $this->buildWhatsappUrl($whatsappNumber, 'Hola Sudoku, quiero hacer una consulta.'),
                'copyrightYear' => (int) date('Y'),
            ],
        ];
    }

    /**
     * @return array{enabled: bool, title: string, body: string, imageUrl: string, mobileImageUrl: string, backgroundImageUrl: string, backgroundColor: string, textColor: string, titleSize: int, bodySize: int, buttonLabel: string, buttonUrl: string, version: string}
     */
    private function startupNotice(): array
    {
        $enabled = $this->isTruthy(SiteGlobalConfig::value('startup_notice_enabled', '0'));
        $title = $this->value('startup_notice_title', '');
        $body = $this->value('startup_notice_body', '');
        $imageUrl = $this->normalizeMediaUrl($this->value('startup_notice_image_url', ''));
        $mobileImageUrl = $this->normalizeMediaUrl($this->value('startup_notice_mobile_image_url', ''));
        $backgroundImageUrl = $this->normalizeMediaUrl($this->value('startup_notice_background_image_url', ''));
        $backgroundColor = $this->sanitizeCssColor($this->value('startup_notice_background_color', '#edf4ff'), '#edf4ff');
        $textColor = $this->sanitizeCssColor($this->value('startup_notice_text_color', '#143a7c'), '#143a7c');
        $titleSize = max(24, min(120, (int) $this->value('startup_notice_title_size', '64')));
        $bodySize = max(14, min(48, (int) $this->value('startup_notice_body_size', '24')));
        $buttonLabel = $this->value('startup_notice_button_label', '');
        $categorySlug = $this->value('startup_notice_category_slug', '');
        $startsAt = $this->parseConfiguredDate($this->value('startup_notice_starts_at', ''));
        $endsAt = $this->parseConfiguredDate($this->value('startup_notice_ends_at', ''));
        $buttonUrl = '';

        if ($categorySlug !== '') {
            $category = Category::query()
                ->where('slug', $categorySlug)
                ->where('is_hidden', false)
                ->first();

            if ($category instanceof Category) {
                $buttonUrl = route('store.catalog', array_filter([
                    'categoria' => $category->slug,
                    'grupo' => (string) $category->group_key,
                ], static fn ($value) => $value !== ''));
            }
        }

        $isScheduled = ($startsAt === null || $startsAt->lte(now())) && ($endsAt === null || $endsAt->gte(now()));
        $versionSource = implode('|', [$enabled ? '1' : '0', $title, $body, $imageUrl, $mobileImageUrl, $backgroundImageUrl, $backgroundColor, $textColor, $titleSize, $bodySize, $buttonLabel, $buttonUrl, (string) $startsAt, (string) $endsAt]);

        return [
            'enabled' => $enabled && $isScheduled && trim($title . $body . $imageUrl) !== '',
            'title' => $title,
            'body' => $body,
            'imageUrl' => $imageUrl,
            'mobileImageUrl' => $mobileImageUrl,
            'backgroundImageUrl' => $backgroundImageUrl,
            'backgroundColor' => $backgroundColor,
            'textColor' => $textColor,
            'titleSize' => $titleSize,
            'bodySize' => $bodySize,
            'buttonLabel' => $buttonLabel,
            'buttonUrl' => $buttonUrl,
            'version' => substr(sha1($versionSource), 0, 12),
        ];
    }

    private function normalizeMediaUrl(string $value): string
    {
        $path = trim($value);
        if ($path === '') {
            return '';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return '/' . ltrim($path, '/');
    }

    private function parseConfiguredDate(string $value): ?Carbon
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function sanitizeCssColor(string $value, string $default): string
    {
        $color = trim($value);

        if (preg_match('/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/', $color) === 1) {
            return $color;
        }

        return $default;
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
