<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRepairTechAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $isAdmin = $user !== null && in_array($user->role, ['admin', 'editor'], true);

        abort_unless($isAdmin || (bool) $request->session()->get('repair_tech_authenticated', false), 403);

        return $next($request);
    }
}
