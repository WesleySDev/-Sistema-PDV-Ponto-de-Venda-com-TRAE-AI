# Script para testar conexão com Railway PostgreSQL
# Execute este script para testar a conexão com o banco do Railway

Write-Host "🚀 Testando conexão com Railway PostgreSQL..." -ForegroundColor Green
Write-Host ""

# Fazer backup do .env atual
if (Test-Path ".env") {
    Write-Host "📋 Fazendo backup do .env atual..." -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup" -Force
}

# Usar configuração do Railway
Write-Host "🔧 Configurando para usar Railway PostgreSQL..." -ForegroundColor Blue
Copy-Item ".env.railway.test" ".env" -Force

Write-Host "✅ Configuração aplicada!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para testar a conexão, execute:" -ForegroundColor Cyan
Write-Host "   go run main.go" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Para voltar à configuração local, execute:" -ForegroundColor Cyan
Write-Host "   .\restore_local_config.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL do banco Railway:" -ForegroundColor Magenta
$railwayUrl = "postgresql://postgres:BqLZeGGdrGUgZgejeRLqLhxkzUfYorGj@hopper.proxy.rlwy.net:53818/railway"
Write-Host "   $railwayUrl" -ForegroundColor White