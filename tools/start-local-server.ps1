param(
    [string]$HostName = '127.0.0.1',
    [int]$AppPort = 8090,
    [int]$VitePort = 5173,
    [switch]$Restart,
    [switch]$OpenBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$tmpPath = Join-Path $repoRoot 'tmp'
$phpLog = Join-Path $tmpPath 'local-php-router.log'
$phpErr = Join-Path $tmpPath 'local-php-router.err.log'
$viteLog = Join-Path $tmpPath 'local-vite.log'
$viteErr = Join-Path $tmpPath 'local-vite.err.log'

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Find-Php {
    $candidates = @(
        (Join-Path $repoRoot '.tools\php-8.3.31\php.exe'),
        (Join-Path $repoRoot '.tools\php-8.3.0\php.exe'),
        (Join-Path $repoRoot 'tools\php-8.3\php.exe')
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    $globalPhp = Get-Command php.exe -ErrorAction SilentlyContinue
    if ($globalPhp) {
        return $globalPhp.Source
    }

    throw 'No encontre PHP. Esperaba .tools\php-8.3.31\php.exe o tools\php-8.3\php.exe.'
}

function Test-Url {
    param(
        [string]$Url,
        [int]$TimeoutSec = 5
    )

    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        & cmd.exe /c "curl.exe -fsS --max-time $TimeoutSec -o NUL ""$Url"" >NUL 2>NUL"
        return $LASTEXITCODE -eq 0
    }

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        return [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500
    } catch {
        return $false
    }
}

function Start-LocalPhpServer {
    Remove-Item -LiteralPath $phpLog, $phpErr -Force -ErrorAction SilentlyContinue
    Start-Process `
        -FilePath $php `
        -ArgumentList @('-S', "${HostName}:${AppPort}", '-t', 'public', 'router.php') `
        -WorkingDirectory $repoRoot `
        -RedirectStandardOutput $phpLog `
        -RedirectStandardError $phpErr `
        -WindowStyle Hidden | Out-Null
}

function Start-LocalViteServer {
    Remove-Item -LiteralPath $viteLog, $viteErr -Force -ErrorAction SilentlyContinue
    Start-Process `
        -FilePath $npm.Source `
        -ArgumentList @('run', 'dev', '--', '--host', $HostName, '--port', [string]$VitePort, '--strictPort') `
        -WorkingDirectory $repoRoot `
        -RedirectStandardOutput $viteLog `
        -RedirectStandardError $viteErr `
        -WindowStyle Hidden | Out-Null
}

function Get-ListeningProcessId {
    param([int]$Port)

    $connection = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $Port } |
        Select-Object -First 1

    if ($null -eq $connection) {
        return $null
    }

    return [int]$connection.OwningProcess
}

function Get-ProcessCommandLine {
    param([int]$ProcessId)

    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        return ''
    }

    return [string]$process.CommandLine
}

function Stop-ProjectListener {
    param([int]$Port)

    $listenerProcessId = Get-ListeningProcessId -Port $Port
    if ($null -eq $listenerProcessId) {
        return
    }

    $commandLine = Get-ProcessCommandLine -ProcessId $listenerProcessId
    $normalizedRoot = [Regex]::Escape($repoRoot)

    if ($commandLine -notmatch $normalizedRoot) {
        throw "El puerto $Port esta ocupado por otro proceso: PID $listenerProcessId. No lo detengo automaticamente."
    }

    Stop-Process -Id $listenerProcessId -Force -ErrorAction SilentlyContinue
}

function Assert-Port-FreeOrProject {
    param([int]$Port)

    $listenerProcessId = Get-ListeningProcessId -Port $Port
    if ($null -eq $listenerProcessId) {
        return
    }

    $commandLine = Get-ProcessCommandLine -ProcessId $listenerProcessId
    $normalizedRoot = [Regex]::Escape($repoRoot)

    if ($commandLine -notmatch $normalizedRoot) {
        throw "El puerto $Port esta ocupado por otro proceso: PID $listenerProcessId. Cerra ese proceso o usa otro puerto."
    }
}

Ensure-Directory -Path $tmpPath

$php = Find-Php
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
    throw 'No encontre npm.cmd. Instala Node.js o revisa el PATH.'
}

$appUrl = "http://${HostName}:${AppPort}"
$viteUrl = "http://${HostName}:${VitePort}"

if ($Restart) {
    Stop-ProjectListener -Port $AppPort
    Stop-ProjectListener -Port $VitePort
    Start-Sleep -Seconds 1
}

$appUp = Test-Url -Url $appUrl
$viteUp = Test-Url -Url "$viteUrl/@vite/client"

if (-not $appUp) {
    Assert-Port-FreeOrProject -Port $AppPort
    Start-LocalPhpServer
}

if (-not $viteUp) {
    Assert-Port-FreeOrProject -Port $VitePort
    Start-LocalViteServer
}

$deadline = (Get-Date).AddSeconds(30)
do {
    Start-Sleep -Milliseconds 750
    $appUp = Test-Url -Url $appUrl
    $viteUp = Test-Url -Url "$viteUrl/@vite/client"
} until (($appUp -and $viteUp) -or (Get-Date) -gt $deadline)

if ($appUp -and -not $viteUp) {
    Stop-ProjectListener -Port $VitePort
    Start-Sleep -Seconds 1
    Start-LocalViteServer

    $deadline = (Get-Date).AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 750
        $viteUp = Test-Url -Url "$viteUrl/@vite/client"
    } until ($viteUp -or (Get-Date) -gt $deadline)
}

if (-not $appUp -or -not $viteUp) {
    Write-Output "No se pudo confirmar el arranque completo."
    Write-Output "Laravel log: $phpLog"
    Write-Output "Laravel error log: $phpErr"
    Write-Output "Vite log: $viteLog"
    Write-Output "Vite error log: $viteErr"
    exit 1
}

if ($OpenBrowser) {
    Start-Process $appUrl | Out-Null
}

Write-Output "Servidor local listo:"
Write-Output "Laravel: $appUrl"
Write-Output "Vite:    $viteUrl"
Write-Output "Logs:"
Write-Output "- $phpLog"
Write-Output "- $viteLog"
