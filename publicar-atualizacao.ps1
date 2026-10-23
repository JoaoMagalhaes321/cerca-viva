# Script para publicar atualizações automáticas OTA do PvZ: Evolution para o celular
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   PvZ: Evolution - Publicador de Atualizações OTA  " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Compilando versão web atualizada..." -ForegroundColor Yellow
npm run build

Write-Host "`n[2/3] Registrando alterações no Git..." -ForegroundColor Yellow
git add .
$commitMsg = Read-Host "Digite a descrição da alteração (ou pressione Enter para 'Atualização automática')"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Atualização automática de balanceamento e melhorias"
}
git commit -m $commitMsg

Write-Host "`n[3/3] Enviando para o GitHub Pages (Nuvem)..." -ForegroundColor Yellow
git push origin main

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host " [SUCESSO] Atualização publicada na Nuvem!" -ForegroundColor Green
Write-Host " Link: https://joaomagalhaes321.github.io/pvz-evolution/" -ForegroundColor Cyan
Write-Host " Abra o jogo no celular para receber a versão nova!" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green
