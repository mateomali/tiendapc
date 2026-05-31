<?php

return [
    'whatsapp_number' => env('TIENDA_WHATSAPP_NUMBER', '5490000000000'),
    'repair_tech_password' => env('REPAIR_TECH_PASSWORD', 'Reypablo'),
    'repair_default_dni' => (int) env('REPAIR_DEFAULT_DNI', 12345678),
    'legacy_repair_db_connection' => env('LEGACY_REPAIR_DB_CONNECTION', 'legacy_repairs'),
    'uploads' => [
        'products' => 'assets/uploads/products',
        'library' => 'assets/uploads/library',
        'repairs' => 'uploads',
        'repairs_thumbnails' => 'uploads/thumbnails',
        'backups' => 'backups',
    ],
];
