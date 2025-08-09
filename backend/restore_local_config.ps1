# Script para restaurar configuração local
# Execute este script para voltar à configuração local após testar o Railway

Write-Host "🔄 Restaurando configuração local..." -ForegroundColor Green
Write-Host ""

# Restaurar backup do .env
if (Test-Path ".env.backup") {
    Write-Host "📋 Restaurando .env original..." -ForegroundColor Yellow
    Copy-Item ".env.backup" ".env" -Force
    Remove-Item ".env.backup" -Force
    Write-Host "✅ Configuração local restaurada!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backup não encontrado. Usando configuração padrão..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -Force
    Write-Host "✅ Configuração padrão aplicada!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏠 Agora você está usando a configuração local novamente." -ForegroundColor Cyan
Write-Host "📝 Para iniciar o servidor local, execute:" -ForegroundColor Cyan
Write-Host "   go run main.go" -ForegroundColor White