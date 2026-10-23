# Script para Gerar Patch de Atualizacao OTA (Over-The-Air)
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   PvZ: Evolution - Gerador de Patch OTA            " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "[1/2] Compilando versao web atualizada..." -ForegroundColor Yellow
npm run build

$pkg = Get-Content "package.json" | ConvertFrom-Json
$version = $pkg.version
$outputDir = Join-Path $PSScriptRoot "patches"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$zipName = "pvz-patch-v$version.zip"
$zipPath = Join-Path $outputDir $zipName

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "[2/2] Compactando patch v$version..." -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $PSScriptRoot "dist\*") -DestinationPath $zipPath -Force

$manifestObj = @{
    version = $version
    url = "https://raw.githubusercontent.com/jvpm3/pvz-evolution-releases/main/patches/$zipName"
    releaseDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
}
$manifest = $manifestObj | ConvertTo-Json
Set-Content -Path (Join-Path $outputDir "update.json") -Value $manifest

Write-Host "`n[SUCESSO] Patch OTA gerado com sucesso!" -ForegroundColor Green
Write-Host "Patch: $zipPath" -ForegroundColor Cyan
Write-Host "Manifest: $(Join-Path $outputDir "update.json")" -ForegroundColor Cyan
