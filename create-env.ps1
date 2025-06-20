# Script PowerShell para Windows

Write-Host "🔧 Criando arquivo .env.local..." -ForegroundColor Yellow

# Remover arquivo existente se houver
if (Test-Path ".env.local") {
    Remove-Item ".env.local"
}

# Criar novo arquivo com as variáveis
@"
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-2303516479543987-062014-1b953593c2522bfea92a27092a437f59-334838550
NEXT_PUBLIC_BASE_URL=http://localhost:3000
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Arquivo .env.local criado!" -ForegroundColor Green
Write-Host "📁 Conteúdo do arquivo:" -ForegroundColor Cyan
Get-Content ".env.local"

Write-Host ""
Write-Host "🔄 Agora reinicie o servidor com: npm run dev" -ForegroundColor Yellow
