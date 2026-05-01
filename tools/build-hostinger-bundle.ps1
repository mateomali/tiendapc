param(
    [string]$OutputRoot = 'dist',
    [string]$ReleaseName = '',
    [switch]$Zip,
    [switch]$PublicHtmlOnly,
    [switch]$IncludeServerEnv
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ReleaseName)) {
    $prefix = if ($PublicHtmlOnly) { 'hostinger_public_html_only_' } else { 'hostinger_bundle_' }
    $ReleaseName = $prefix + (Get-Date -Format 'yyyyMMdd_HHmmss')
}

if ([System.IO.Path]::IsPathRooted($OutputRoot)) {
    $outputRootPath = [System.IO.Path]::GetFullPath($OutputRoot)
} else {
    $outputRootPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $OutputRoot))
}

$bundlePath = Join-Path $outputRootPath $ReleaseName
$publicHtmlPath = if ($PublicHtmlOnly) { $bundlePath } else { Join-Path $bundlePath 'public_html' }
$privateAppPath = if ($PublicHtmlOnly) { Join-Path $bundlePath 'laravel_app' } else { Join-Path $bundlePath 'laravel_app' }

if (Test-Path -LiteralPath $bundlePath) {
    throw "La carpeta de salida ya existe: $bundlePath"
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Write-Utf8NoBomFile {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Read-LocalEnvFile {
    param([string]$Path)

    $values = @{}
    if (-not (Test-Path -LiteralPath $Path)) {
        return $values
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#') -or -not $trimmed.Contains('=')) {
            continue
        }

        $parts = $trimmed.Split('=', 2)
        $value = $parts[1].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $values[$parts[0].Trim()] = $value
    }

    return $values
}

function Get-ServerEnvValue {
    param(
        [hashtable]$Values,
        [string]$Name,
        [string]$Default = ''
    )

    if ($Values.ContainsKey($Name) -and -not [string]::IsNullOrWhiteSpace([string]$Values[$Name])) {
        return [string]$Values[$Name]
    }

    $environmentValue = [Environment]::GetEnvironmentVariable($Name)
    if (-not [string]::IsNullOrWhiteSpace($environmentValue)) {
        return $environmentValue
    }

    if ($Default -ne '') {
        return $Default
    }

    throw "Falta configurar $Name. Crea tools/hostinger.env.local o defini la variable de entorno antes de usar -IncludeServerEnv."
}

function New-RandomBase64Token {
    param([int]$ByteCount = 32)

    $randomBytes = New-Object byte[] $ByteCount
    $randomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomGenerator.GetBytes($randomBytes)
    } finally {
        $randomGenerator.Dispose()
    }

    return [Convert]::ToBase64String($randomBytes)
}

function Copy-DirectorySafe {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "No existe la ruta requerida: $Source"
    }

    Ensure-Directory -Path $Destination
    Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

function Remove-IfExists {
    param([string]$Path)

    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    }
}

function Remove-MatchingFiles {
    param(
        [string]$Path,
        [string[]]$Patterns
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    foreach ($pattern in $Patterns) {
        Get-ChildItem -LiteralPath $Path -Filter $pattern -File -Recurse -Force | ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force
        }
    }
}

Ensure-Directory -Path $outputRootPath
Ensure-Directory -Path $bundlePath
Ensure-Directory -Path $publicHtmlPath
Ensure-Directory -Path $privateAppPath

$npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    throw 'No encontre npm.cmd para compilar el frontend.'
}

Write-Host 'Compilando frontend para produccion...'
Push-Location $repoRoot
try {
    & $npmCmd.Source run build
    if ($LASTEXITCODE -ne 0) {
        throw 'Fallo la compilacion del frontend.'
    }
} finally {
    Pop-Location
}

$privateDirs = @(
    'app',
    'bootstrap',
    'config',
    'database',
    'resources',
    'routes',
    'vendor'
)

foreach ($dir in $privateDirs) {
    Copy-DirectorySafe -Source (Join-Path $repoRoot $dir) -Destination $privateAppPath
}

Remove-MatchingFiles -Path (Join-Path $privateAppPath 'database') -Patterns @(
    '*.sqlite',
    '*.sqlite-*',
    '*.sqlite.bak*',
    '*.db',
    '*.db-*',
    '*.bak'
)
Remove-IfExists -Path (Join-Path $privateAppPath 'bootstrap\cache\packages.php')
Remove-IfExists -Path (Join-Path $privateAppPath 'bootstrap\cache\services.php')
Ensure-Directory -Path (Join-Path $privateAppPath 'bootstrap\cache')

$privateFiles = @(
    'artisan',
    'composer.json',
    'composer.lock',
    '.env.example'
)

foreach ($file in $privateFiles) {
    $sourcePath = Join-Path $repoRoot $file
    if (Test-Path -LiteralPath $sourcePath) {
        Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $privateAppPath $file) -Force
    }
}

$storageSource = Join-Path $repoRoot 'storage'
$storageTarget = Join-Path $privateAppPath 'storage'
Copy-DirectorySafe -Source $storageSource -Destination $privateAppPath

Remove-IfExists -Path (Join-Path $storageTarget 'logs')
Remove-IfExists -Path (Join-Path $storageTarget 'backups')
Remove-IfExists -Path (Join-Path $storageTarget 'legacy-ui-backup')
Remove-IfExists -Path (Join-Path $storageTarget 'framework\views')
Remove-IfExists -Path (Join-Path $storageTarget 'framework\sessions')
Remove-IfExists -Path (Join-Path $storageTarget 'framework\cache\data')

Ensure-Directory -Path (Join-Path $storageTarget 'logs')
Ensure-Directory -Path (Join-Path $storageTarget 'backups')
Ensure-Directory -Path (Join-Path $storageTarget 'framework\views')
Ensure-Directory -Path (Join-Path $storageTarget 'framework\sessions')
Ensure-Directory -Path (Join-Path $storageTarget 'framework\cache\data')

Set-Content -LiteralPath (Join-Path $storageTarget 'logs\.gitignore') -Value '*' -Encoding ASCII
Set-Content -LiteralPath (Join-Path $storageTarget 'backups\.gitkeep') -Value '' -Encoding ASCII
Set-Content -LiteralPath (Join-Path $storageTarget 'framework\views\.gitignore') -Value '*' -Encoding ASCII
Set-Content -LiteralPath (Join-Path $storageTarget 'framework\sessions\.gitignore') -Value '*' -Encoding ASCII
Set-Content -LiteralPath (Join-Path $storageTarget 'framework\cache\data\.gitignore') -Value '*' -Encoding ASCII

Copy-DirectorySafe -Source (Join-Path $repoRoot 'public') -Destination $bundlePath

$publicTarget = Join-Path $bundlePath 'public'
Get-ChildItem -LiteralPath $publicTarget -Force | ForEach-Object {
    Move-Item -LiteralPath $_.FullName -Destination $publicHtmlPath -Force
}
Remove-Item -LiteralPath $publicTarget -Force

Remove-IfExists -Path (Join-Path $publicHtmlPath 'hot')
Remove-IfExists -Path (Join-Path $publicHtmlPath 'backups')
Remove-IfExists -Path (Join-Path $publicHtmlPath 'debug-repairs.php')
Remove-MatchingFiles -Path $publicHtmlPath -Patterns @(
    '*.bak',
    '*.bak.*',
    '*.backup',
    '*.backup.*'
)

$manifestPath = Join-Path $publicHtmlPath 'build\manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "No se genero el manifest de Vite esperado: $manifestPath"
}

$indexPath = Join-Path $publicHtmlPath 'index.php'
$indexContent = Get-Content -LiteralPath $indexPath -Raw
if ($PublicHtmlOnly) {
    $indexContent = $indexContent.Replace("__DIR__.'/../storage/framework/maintenance.php'", "__DIR__.'/laravel_app/storage/framework/maintenance.php'")
    $indexContent = $indexContent.Replace("__DIR__.'/../vendor/autoload.php'", "__DIR__.'/laravel_app/vendor/autoload.php'")
    $indexContent = $indexContent.Replace("__DIR__.'/../bootstrap/app.php'", "__DIR__.'/laravel_app/bootstrap/app.php'")
    $indexContent = $indexContent.Replace("define('LARAVEL_START', microtime(true));", "define('LARAVEL_START', microtime(true));`r`ndefine('LARAVEL_PUBLIC_PATH', __DIR__);")
} else {
    $indexContent = $indexContent.Replace("__DIR__.'/../storage/framework/maintenance.php'", "__DIR__.'/../laravel_app/storage/framework/maintenance.php'")
    $indexContent = $indexContent.Replace("__DIR__.'/../vendor/autoload.php'", "__DIR__.'/../laravel_app/vendor/autoload.php'")
    $indexContent = $indexContent.Replace("__DIR__.'/../bootstrap/app.php'", "__DIR__.'/../laravel_app/bootstrap/app.php'")
}
Write-Utf8NoBomFile -Path $indexPath -Content $indexContent

$writtenIndexContent = Get-Content -LiteralPath $indexPath -Raw
if ($PublicHtmlOnly) {
    if ($writtenIndexContent -notmatch "define\('LARAVEL_PUBLIC_PATH', __DIR__\);") {
        throw 'El index.php del bundle no quedo saneado con LARAVEL_PUBLIC_PATH.'
    }

    if ($writtenIndexContent -match "\.\./bootstrap/app\.php|\.{2}/vendor/autoload\.php|\.{2}/storage/framework/maintenance\.php") {
        throw 'El index.php del bundle conserva rutas relativas antiguas fuera de public_html.'
    }
}

$bootstrapAppPath = Join-Path $privateAppPath 'bootstrap\app.php'
$bootstrapAppContent = Get-Content -LiteralPath $bootstrapAppPath -Raw
if ($bootstrapAppContent -notmatch 'usePublicPath') {
    throw 'bootstrap/app.php no respeta LARAVEL_PUBLIC_PATH; el manifest podria buscarse en la ruta incorrecta.'
}

$publicHtaccess = @'
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    RewriteRule (^|/)\.(?!well-known/) - [F,L]
    RewriteRule ^(?:laravel_app)(?:/|$) - [F,L,NC]
    RewriteRule ^(?:composer\.(?:json|lock)|package(?:-lock)?\.json|vite\.config\.(?:js|ts)|tsconfig\.json)$ - [F,L,NC]
    RewriteRule ^reparacion/?$ reparacion.php [L,QSA,NC]
    RewriteRule ^reparaciones/?$ reparaciones.php [L,QSA,NC]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
'@
Set-Content -LiteralPath (Join-Path $publicHtmlPath '.htaccess') -Value $publicHtaccess -Encoding ASCII

$privateHtaccess = @'
Options -Indexes
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Deny from all
</IfModule>
'@
Set-Content -LiteralPath (Join-Path $privateAppPath '.htaccess') -Value $privateHtaccess -Encoding ASCII

if ($IncludeServerEnv) {
    $serverEnv = Read-LocalEnvFile -Path (Join-Path $PSScriptRoot 'hostinger.env.local')
    $appUrl = Get-ServerEnvValue -Values $serverEnv -Name 'APP_URL' -Default 'https://www.sudokumerlo.com'
    $debugKey = Get-ServerEnvValue -Values $serverEnv -Name 'APP_DEBUG_KEY' -Default (New-RandomBase64Token -ByteCount 24)
    $dbHost = Get-ServerEnvValue -Values $serverEnv -Name 'DB_HOST' -Default 'localhost'
    $dbPort = Get-ServerEnvValue -Values $serverEnv -Name 'DB_PORT' -Default '3306'
    $dbDatabase = Get-ServerEnvValue -Values $serverEnv -Name 'DB_DATABASE'
    $dbUsername = Get-ServerEnvValue -Values $serverEnv -Name 'DB_USERNAME'
    $dbPassword = Get-ServerEnvValue -Values $serverEnv -Name 'DB_PASSWORD'
    $repairTechPassword = Get-ServerEnvValue -Values $serverEnv -Name 'REPAIR_TECH_PASSWORD'
    $whatsappNumber = Get-ServerEnvValue -Values $serverEnv -Name 'TIENDA_WHATSAPP_NUMBER' -Default '5490000000000'

    $appKey = 'base64:' + (New-RandomBase64Token -ByteCount 32)

    $envContent = @"
APP_NAME="Sudokumerlo Custom"
APP_URL=$appUrl
APP_ENV=production
APP_DEBUG=false
APP_DEBUG_KEY=$debugKey
APP_TIMEZONE=America/Argentina/Buenos_Aires
APP_KEY=$appKey

APP_LOCALE=es
APP_FALLBACK_LOCALE=es
APP_FAKER_LOCALE=es_AR

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_DATABASE=$dbDatabase
DB_USERNAME=$dbUsername
DB_PASSWORD=$dbPassword

DB_NAME=$dbDatabase
DB_USER=$dbUsername
DB_PASS=$dbPassword

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.sudokumerlo.com
SESSION_COOKIE=sudokumerlo_custom_session
SESSION_NAME=sudokumerlo_custom_session

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
CACHE_STORE=file

MAIL_MAILER=log
MAIL_FROM_ADDRESS="noreply@sudokumerlo.com"
MAIL_FROM_NAME="Sudokumerlo Custom"

WP_SOURCE_URL=https://sudokumerlo.com
TIENDA_WHATSAPP_NUMBER=$whatsappNumber
REPAIR_TECH_PASSWORD=$repairTechPassword
REPAIR_DEFAULT_DNI=12345678
LEGACY_REPAIR_DB_CONNECTION=legacy_repairs
LEGACY_SOURCE_DB_HOST=$dbHost
LEGACY_SOURCE_DB_PORT=$dbPort
LEGACY_SOURCE_DB_DATABASE=$dbDatabase
LEGACY_SOURCE_DB_USERNAME=$dbUsername
LEGACY_SOURCE_DB_PASSWORD=$dbPassword

VITE_APP_NAME="Sudokumerlo Custom"
"@
    Write-Utf8NoBomFile -Path (Join-Path $privateAppPath '.env') -Content $envContent
}

$guideTitle = if ($PublicHtmlOnly) { 'Bundle seguro para Hostinger - solo public_html' } else { 'Bundle seguro para Hostinger' }
$uploadInstructions = if ($PublicHtmlOnly) {
@'
Subida recomendada:
1. Entra al gestor de archivos de Hostinger.
2. Abri domains/tudominio.com/public_html.
3. Sube y extrae este ZIP directamente dentro de public_html.
4. Deben quedar index.php, .htaccess, assets/, build/, uploads/ y laravel_app/ dentro de public_html.

Seguridad:
- public_html/.htaccess bloquea acceso web a /laravel_app.
- public_html/laravel_app/.htaccess tambien deniega acceso directo.
'@
} else {
@'
Subida recomendada:
1. Subi TODO el contenido de public_html/ dentro de la carpeta public_html de tu dominio.
2. Subi la carpeta laravel_app/ como hermana de public_html, no dentro de public_html.
   Ejemplo:
   - domains/tudominio.com/public_html
   - domains/tudominio.com/laravel_app
'@
}

$envNote = if ($IncludeServerEnv) {
@'
Archivos sensibles:
- Este bundle incluye laravel_app/.env con las credenciales de servidor que indicaste.
- No compartas este ZIP publicamente.
'@
} else {
@'
Archivos sensibles:
- Este bundle NO incluye .env por seguridad.
- Crea laravel_app/.env manualmente a partir de laravel_app/.env.example.
'@
}

$guide = @"
$guideTitle
===========================

Estructura del paquete:
$(if ($PublicHtmlOnly) { '- contenido directo para public_html/' } else { '- public_html/' + [Environment]::NewLine + '- laravel_app/' })

$uploadInstructions

Permisos recomendados:
- laravel_app/storage
- laravel_app/bootstrap/cache

$envNote

Datos y base:
- El bundle incluye vendor y build de produccion.
- No incluye backups ni logs locales.
- La base de datos se importa por separado desde tu dump/backup.

Chequeos utiles:
- public_html/index.php debe apuntar correctamente a laravel_app/vendor/autoload.php
- public_html/.htaccess ya viene preparado
- elimina cualquier archivo public/hot si existiera en el hosting
"@
Write-Utf8NoBomFile -Path (Join-Path $bundlePath 'SUBIR_A_HOSTINGER.txt') -Content $guide

$zipPath = ''
if ($Zip) {
    $zipPath = Join-Path $outputRootPath ($ReleaseName + '.zip')
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -Path (Join-Path $bundlePath '*') -DestinationPath $zipPath -Force
}

Write-Host "Bundle generado: $bundlePath"
if ($Zip) {
    Write-Host "ZIP generado: $zipPath"
}
