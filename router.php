<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$publicPath = __DIR__ . '/public';
$requestedPath = realpath($publicPath . $uri);

if ($uri !== '/' && $requestedPath !== false && str_starts_with($requestedPath, realpath($publicPath)) && is_file($requestedPath)) {
    $extension = strtolower(pathinfo($requestedPath, PATHINFO_EXTENSION));
    $mimeType = match ($extension) {
        'js', 'mjs' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        default => mime_content_type($requestedPath) ?: 'application/octet-stream',
    };
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . (string) filesize($requestedPath));
    readfile($requestedPath);
    return true;
}

require $publicPath . '/index.php';
