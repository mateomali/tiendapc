param(
    [string]$OutputRoot = 'dist',
    [string]$ReleaseName = '',
    [switch]$IncludeServerEnv
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$builder = Join-Path $scriptRoot 'build-hostinger-bundle.ps1'

if (-not (Test-Path -LiteralPath $builder)) {
    throw "No se encontro el generador base: $builder"
}

if ([string]::IsNullOrWhiteSpace($ReleaseName)) {
    $ReleaseName = 'hostinger_public_html_safe_' + (Get-Date -Format 'yyyyMMdd_HHmmss')
}

$arguments = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $builder,
    '-OutputRoot', $OutputRoot,
    '-ReleaseName', $ReleaseName,
    '-PublicHtmlOnly',
    '-Zip'
)

if ($IncludeServerEnv) {
    $arguments += '-IncludeServerEnv'
}

& powershell @arguments
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
