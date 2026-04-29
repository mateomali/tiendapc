<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$expectedKey = 'SudokuDebug_2026_Real';
$providedKey = (string) ($_GET['key'] ?? '');

if ($providedKey === '' || ! hash_equals($expectedKey, $providedKey)) {
    http_response_code(404);
    echo json_encode(['error' => 'not found'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$root = __DIR__;
$appPath = is_dir($root . '/laravel_app') ? $root . '/laravel_app' : dirname($root);
$envPath = $appPath . '/.env';
$logPath = $appPath . '/storage/logs/laravel.log';

function read_env_file(string $path): array
{
    if (! is_file($path)) {
        return [];
    }

    $env = [];
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        if ((str_starts_with($value, '"') && str_ends_with($value, '"')) || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }
        $env[trim($key)] = $value;
    }

    return $env;
}

function pdo_query(PDO $pdo, string $sql, array $params = []): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

function exception_details(Throwable $exception): array
{
    return [
        'class' => $exception::class,
        'message' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
    ];
}

function last_laravel_exception(string $contents): ?string
{
    if (preg_match_all('/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\].*?(?=\n\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]|\z)/s', $contents, $matches) !== 1) {
        return null;
    }

    $last = end($matches[0]);

    return is_string($last) ? substr($last, 0, 30000) : null;
}

$env = read_env_file($envPath);
$database = $env['DB_DATABASE'] ?? $env['DB_NAME'] ?? '';
$report = [
    'debug_file' => __FILE__,
    'time' => date(DATE_ATOM),
    'php' => PHP_VERSION,
    'app_path' => $appPath,
    'env_exists' => is_file($envPath),
    'log_exists' => is_file($logPath),
    'db' => [
        'host' => $env['DB_HOST'] ?? null,
        'port' => $env['DB_PORT'] ?? null,
        'database' => $database,
        'username' => $env['DB_USERNAME'] ?? $env['DB_USER'] ?? null,
    ],
    'checks' => [],
    'laravel_checks' => [],
    'log_tail' => null,
    'last_exception' => null,
];

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $env['DB_HOST'] ?? 'localhost',
        $env['DB_PORT'] ?? '3306',
        $database,
    );

    $pdo = new PDO(
        $dsn,
        $env['DB_USERNAME'] ?? $env['DB_USER'] ?? '',
        $env['DB_PASSWORD'] ?? $env['DB_PASS'] ?? '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ],
    );

    $report['checks']['db_connected'] = true;

    foreach (['users', 'ordenes', 'orden_eventos'] as $table) {
        $rows = pdo_query($pdo, 'SHOW TABLES LIKE ?', [$table]);
        $report['checks']['tables'][$table] = count($rows) > 0;
    }

    foreach ([
        'ordenes' => ['registro_id', 'id', 'reparacion', 'fecha', 'nombre_cliente', 'dni', 'contacto', 'modelo', 'descripcion', 'observaciones', 'monto', 'senia', 'fecha_estimada', 'estado', 'entregado', 'fecha_entregado', 'imagen', 'imagen3', 'imagen4', 'repuesto', 'categorias_reparacion', 'created_at', 'updated_at'],
        'orden_eventos' => ['id', 'orden_id', 'reparacion', 'usuario', 'evento', 'estado_anterior', 'estado_nuevo', 'created_at'],
    ] as $table => $columns) {
        $existing = [];
        if (($report['checks']['tables'][$table] ?? false) === true) {
            foreach (pdo_query($pdo, 'SHOW COLUMNS FROM `' . $table . '`') as $column) {
                $existing[] = $column['Field'];
            }
        }

        $report['checks']['columns'][$table] = [
            'existing' => $existing,
            'missing' => array_values(array_diff($columns, $existing)),
        ];
    }

    if (($report['checks']['tables']['ordenes'] ?? false) === true) {
        $report['checks']['ordenes_count'] = (int) (pdo_query($pdo, 'SELECT COUNT(*) AS total FROM ordenes')[0]['total'] ?? 0);
        $report['checks']['ordenes_latest'] = pdo_query($pdo, 'SELECT * FROM ordenes ORDER BY id DESC, reparacion ASC LIMIT 3');
        $report['checks']['active_query'] = pdo_query($pdo, "SELECT id, reparacion, nombre_cliente, estado, entregado, fecha_estimada FROM ordenes WHERE entregado = 'no' ORDER BY id DESC, reparacion ASC LIMIT 5");
    }
} catch (Throwable $exception) {
    $report['checks']['db_connected'] = false;
    $report['checks']['error'] = exception_details($exception);
}

try {
    require_once $appPath . '/vendor/autoload.php';
    $app = require $appPath . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $report['laravel_checks']['booted'] = true;
    $report['laravel_checks']['env'] = app()->environment();
    $report['laravel_checks']['db_default'] = config('database.default');
    $report['laravel_checks']['repair_uploads'] = config('tienda.uploads.repairs');

    $service = app(App\Services\RepairService::class);
    $controller = app(App\Http\Controllers\Repairs\WorkbenchController::class);

    try {
        $orders = $service->activeOrders(['summary_range' => 'all']);
        $report['laravel_checks']['active_orders_count'] = $orders->count();
        $report['laravel_checks']['active_orders_first'] = $orders->take(2)->map(fn ($order) => [
            'registro_id' => $order->registro_id ?? null,
            'id' => $order->id ?? null,
            'reparacion' => $order->reparacion ?? null,
            'estado' => $order->estado ?? null,
            'entregado' => $order->entregado ?? null,
        ])->values()->all();
    } catch (Throwable $exception) {
        $report['laravel_checks']['active_orders_error'] = exception_details($exception);
        $orders = collect();
    }

    try {
        $report['laravel_checks']['summary'] = $service->summary(['summary_range' => 'all']);
    } catch (Throwable $exception) {
        $report['laravel_checks']['summary_error'] = exception_details($exception);
    }

    try {
        $report['laravel_checks']['group_tickets'] = array_slice($controller->groupTickets($orders, false), 0, 2);
    } catch (Throwable $exception) {
        $report['laravel_checks']['group_tickets_error'] = exception_details($exception);
    }
} catch (Throwable $exception) {
    $report['laravel_checks']['booted'] = false;
    $report['laravel_checks']['error'] = exception_details($exception);
}

if (is_file($logPath)) {
    $contents = file_get_contents($logPath);
    $report['log_tail'] = $contents === false ? null : substr($contents, -12000);
    $report['last_exception'] = $contents === false ? null : last_laravel_exception($contents);
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
