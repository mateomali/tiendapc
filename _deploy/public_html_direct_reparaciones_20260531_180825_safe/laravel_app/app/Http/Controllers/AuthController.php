<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_DECAY_SECONDS = 60;

    public function showLogin(): Response
    {
        return Inertia::render('Auth/LoginPage');
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $throttleKey = Str::lower($request->string('email')->toString()) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::LOGIN_MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = max(1, (int) ceil($seconds / 60));

            return back()->withInput($request->except('password'))->with(
                'error',
                'Demasiados intentos. Intenta nuevamente en ' . $minutes . ' minuto(s).',
            );
        }

        if (! Auth::attempt($request->safe()->only(['email', 'password']), $request->boolean('remember'))) {
            $attempts = RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);
            $remaining = max(0, self::LOGIN_MAX_ATTEMPTS - $attempts);

            if (RateLimiter::tooManyAttempts($throttleKey, self::LOGIN_MAX_ATTEMPTS)) {
                $minutes = max(1, (int) ceil(RateLimiter::availableIn($throttleKey) / 60));

                return back()->withInput($request->except('password'))->with(
                    'error',
                    'Demasiados intentos. Tu acceso fue bloqueado por ' . $minutes . ' minuto(s).',
                );
            }

            return back()->withInput($request->except('password'))->with(
                'error',
                'Credenciales invalidas. Intentos restantes: ' . $remaining . '.',
            );
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return redirect()->route('admin.app');
    }

    public function logout(): RedirectResponse
    {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login');
    }
}
