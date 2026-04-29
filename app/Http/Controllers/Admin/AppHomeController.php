<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AppHomeController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/AppHomePage', [
            'cards' => [
                [
                    'title' => 'Productos y ventas',
                    'description' => 'Gestiona catalogo, precios, imagenes, ventas y tickets.',
                    'primaryUrl' => route('admin.products.index'),
                    'secondaryUrl' => route('admin.sales.create'),
                    'primaryLabel' => 'Abrir productos',
                    'secondaryLabel' => 'Nueva venta',
                    'tone' => 'store',
                ],
                [
                    'title' => 'Reparaciones',
                    'description' => 'Ingresa equipos, consulta ordenes, actualiza estados y adjunta fotos.',
                    'primaryUrl' => route('repairs.workbench'),
                    'secondaryUrl' => route('repairs.ingress'),
                    'primaryLabel' => 'Abrir consultas',
                    'secondaryLabel' => 'Nueva orden',
                    'tone' => 'repairs',
                ],
            ],
            'logoUrl' => asset('favicon.ico'),
        ]);
    }
}
