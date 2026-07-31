<?php

namespace App\Http\Controllers\Repairs;

use App\Http\Controllers\Controller;
use App\Http\Requests\Repairs\TechLoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TechAuthController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->session()->get('repair_tech_authenticated', false)) {
            $ticketDirecto = (int) $request->query('ticket_directo', 0);

            if ($ticketDirecto > 0) {
                return redirect()->route('repairs.tickets.show', ['orderId' => $ticketDirecto]);
            }

            return redirect()->route('repairs.workbench');
        }

        return Inertia::render('Repairs/TechLoginPage');
    }

    public function login(TechLoginRequest $request): RedirectResponse
    {
        if ($request->validated()['password'] !== config('tienda.repair_tech_password')) {
            return back()->with('error', 'Clave tecnica incorrecta.');
        }

        $request->session()->put('repair_tech_authenticated', true);

        return redirect()->route('repairs.workbench');
    }

    public function logout(): RedirectResponse
    {
        request()->session()->forget('repair_tech_authenticated');

        return redirect()->route('repairs.workbench');
    }
}
