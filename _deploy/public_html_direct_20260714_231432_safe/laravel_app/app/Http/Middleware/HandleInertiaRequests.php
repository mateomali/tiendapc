<?php

namespace App\Http\Middleware;

use App\Services\CartService;
use App\Services\SiteViewDataService;
use Illuminate\Http\Request;
use Inertia\Middleware;

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
}
