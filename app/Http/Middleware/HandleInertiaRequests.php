<?php

namespace App\Http\Middleware;

use App\Services\CartService;
use App\Services\SiteViewDataService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function handle(Request $request, Closure $next): Response
    {
        $response = parent::handle($request, $next);

        if ($request->headers->has('X-Inertia') || $response->headers->has('X-Inertia') || str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, private');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
            $this->appendVaryHeader($response, 'X-Inertia');
            $this->appendVaryHeader($response, 'X-Inertia-Version');
            $this->appendVaryHeader($response, 'Accept');
        }

        return $response;
    }

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
                'whatsappNumber' => config('tienda.whatsapp_number'),
            ],
            'layout' => app(SiteViewDataService::class)->layout($request),
            'auth' => [
                'user' => $request->user()?->only(['id', 'name', 'email', 'role']),
                'isRepairTech' => (bool) $request->session()->get('repair_tech_authenticated', false),
                'canManageRepairs' => $request->user() !== null
                    && in_array($request->user()->role, ['admin', 'editor'], true),
            ],
            'cart' => [
                'count' => app(CartService::class)->count(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function appendVaryHeader(Response $response, string $header): void
    {
        $vary = collect(explode(',', (string) $response->headers->get('Vary')))
            ->map(fn (string $value): string => trim($value))
            ->filter()
            ->all();

        if (! in_array($header, $vary, true)) {
            $vary[] = $header;
        }

        $response->headers->set('Vary', implode(', ', $vary));
    }
}
