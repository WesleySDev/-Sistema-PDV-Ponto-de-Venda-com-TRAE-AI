# Setup Railway Database Connection
# This script configures the project to use Railway PostgreSQL

Write-Host "Setting up Railway PostgreSQL connection..." -ForegroundColor Green
Write-Host ""

# Backup current .env
if (Test-Path ".env") {
    Write-Host "Backing up current .env..." -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup" -Force
}

# Use Railway configuration
Write-Host "Applying Railway configuration..." -ForegroundColor Blue
Copy-Item ".env.railway.test" ".env" -Force

Write-Host "Configuration applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To test the connection, run:" -ForegroundColor Cyan
Write-Host "   go run main.go" -ForegroundColor White
Write-Host ""
Write-Host "To restore local config, run:" -ForegroundColor Cyan
Write-Host "   .\restore_local_config.ps1" -ForegroundColor White