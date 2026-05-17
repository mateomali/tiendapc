<?php

declare(strict_types=1);

if ($argc < 3) {
    fwrite(STDERR, "Usage: php tools/import-repair-dump.php <dump.sql> <sqlite.db>\n");
    exit(1);
}

[$script, $dumpPath, $sqlitePath] = $argv;

if (! is_file($dumpPath)) {
    fwrite(STDERR, "Dump not found: {$dumpPath}\n");
    exit(1);
}

if (! is_file($sqlitePath)) {
    fwrite(STDERR, "SQLite database not found: {$sqlitePath}\n");
    exit(1);
}

$sql = file_get_contents($dumpPath);

if ($sql === false) {
    fwrite(STDERR, "Unable to read dump: {$dumpPath}\n");
    exit(1);
}

$pdo = new PDO('sqlite:'.$sqlitePath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS categorias_reparacion (
    id INTEGER PRIMARY KEY,
    nombre varchar NOT NULL
)
SQL);

$pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS orden_reparaciones (
    orden_id INTEGER NOT NULL,
    item_nro INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    equipo varchar NOT NULL,
    descripcion TEXT NOT NULL,
    repuesto TEXT,
    monto numeric NOT NULL DEFAULT 0,
    fecha_estimada date NOT NULL,
    estado varchar NOT NULL DEFAULT 'PENDIENTE',
    PRIMARY KEY (orden_id, item_nro)
)
SQL);

$pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS reparacion_imagenes (
    id INTEGER PRIMARY KEY,
    orden_id INTEGER NOT NULL,
    item_nro INTEGER NOT NULL,
    filename varchar NOT NULL,
    created_at datetime
)
SQL);

$tables = [
    'categorias_reparacion',
    'orden_eventos',
    'orden_reparaciones',
    'reparacion_imagenes',
    'ordenes',
    'repair_parts',
    'repair_part_boxes',
];

$pdo->beginTransaction();

try {
    $pdo->exec('PRAGMA foreign_keys = OFF');

    foreach ($tables as $table) {
        $pdo->exec('DELETE FROM '.$table);
    }

    $counts = [];

    foreach ($tables as $table) {
        $dbColumns = tableColumns($pdo, $table);
        $insertable = array_flip($dbColumns);
        unset($insertable['registro_id']);

        $counts[$table] = importTable($pdo, $sql, $table, $insertable);
    }

    foreach (['ordenes', 'orden_eventos', 'repair_parts', 'repair_part_boxes', 'categorias_reparacion', 'reparacion_imagenes'] as $table) {
        $max = $pdo->query('SELECT MAX(id) FROM '.$table)->fetchColumn();

        if ($max !== false && $max !== null) {
            $stmt = $pdo->prepare("UPDATE sqlite_sequence SET seq = :seq WHERE name = :name");
            $stmt->execute(['seq' => (int) $max, 'name' => $table]);
        }
    }

    $pdo->commit();
} catch (Throwable $exception) {
    $pdo->rollBack();
    throw $exception;
}

foreach ($counts as $table => $count) {
    echo $table.': '.$count.PHP_EOL;
}

function tableColumns(PDO $pdo, string $table): array
{
    $columns = [];

    foreach ($pdo->query('PRAGMA table_info('.$table.')') as $row) {
        $columns[] = $row['name'];
    }

    return $columns;
}

/**
 * @param array<string, int> $insertable
 */
function importTable(PDO $pdo, string $dumpSql, string $table, array $insertable): int
{
    $pattern = '/INSERT INTO `'.preg_quote($table, '/').'` \(([^)]*)\) VALUES\s*(.*?);/s';

    if (! preg_match_all($pattern, $dumpSql, $matches, PREG_SET_ORDER)) {
        return 0;
    }

    $count = 0;

    foreach ($matches as $match) {
        $columns = array_map(
            static fn (string $column): string => trim($column, " `\t\n\r\0\x0B"),
            explode(',', $match[1])
        );

        $rows = parseValues($match[2]);

        foreach ($rows as $row) {
            $payload = [];

            foreach ($columns as $index => $column) {
                if (array_key_exists($column, $insertable)) {
                    $payload[$column] = $row[$index] ?? null;
                }
            }

            if ($payload === []) {
                continue;
            }

            $columnList = array_keys($payload);
            $placeholders = array_map(static fn (string $column): string => ':'.$column, $columnList);
            $statement = $pdo->prepare(
                'INSERT INTO '.$table.' (`'.implode('`, `', $columnList).'`) VALUES ('.implode(', ', $placeholders).')'
            );
            $statement->execute($payload);
            $count++;
        }
    }

    return $count;
}

/**
 * @return list<list<mixed>>
 */
function parseValues(string $valuesSql): array
{
    $rows = [];
    $row = [];
    $value = '';
    $inString = false;
    $escape = false;
    $depth = 0;
    $length = strlen($valuesSql);

    for ($i = 0; $i < $length; $i++) {
        $char = $valuesSql[$i];

        if ($inString) {
            if ($escape) {
                $value .= match ($char) {
                    '0' => "\0",
                    'n' => "\n",
                    'r' => "\r",
                    't' => "\t",
                    'Z' => "\x1A",
                    default => $char,
                };
                $escape = false;
                continue;
            }

            if ($char === '\\') {
                $escape = true;
                continue;
            }

            if ($char === "'") {
                $inString = false;
                continue;
            }

            $value .= $char;
            continue;
        }

        if ($char === "'") {
            $inString = true;
            continue;
        }

        if ($char === '(') {
            if ($depth === 0) {
                $row = [];
                $value = '';
            } else {
                $value .= $char;
            }

            $depth++;
            continue;
        }

        if ($char === ')') {
            $depth--;

            if ($depth === 0) {
                $row[] = normalizeValue($value);
                $rows[] = $row;
                $value = '';
                continue;
            }

            $value .= $char;
            continue;
        }

        if ($char === ',' && $depth === 1) {
            $row[] = normalizeValue($value);
            $value = '';
            continue;
        }

        if ($depth > 0) {
            $value .= $char;
        }
    }

    return $rows;
}

function normalizeValue(string $value): mixed
{
    $value = trim($value);

    if (strcasecmp($value, 'NULL') === 0) {
        return null;
    }

    if ($value === '') {
        return '';
    }

    if (preg_match('/^-?\d+$/', $value)) {
        return (int) $value;
    }

    if (preg_match('/^-?\d+\.\d+$/', $value)) {
        return $value;
    }

    return $value;
}
