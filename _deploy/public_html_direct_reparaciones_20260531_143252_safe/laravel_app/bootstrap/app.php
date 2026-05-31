<?php

use App\Http\Middleware\EnsureRepairTechAuthenticated;
use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'repair.tech' => EnsureRepairTechAuthenticated::class,
            'role' => EnsureUserRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

if (defined('LARAVEL_PUBLIC_PATH')) {
    $app->usePublicPath((string) constant('LARAVEL_PUBLIC_PATH'));
}

return $app;
