# Script para testar a API

# Fazer login
$loginData = @{
    email = 'admin@pdv.com'
    password = 'admin123'
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' -Method POST -Body $loginData -ContentType 'application/json'
$token = $loginResponse.token

Write-Host "Token obtido: $($token.Substring(0,20))..."

# Testar categorias
Write-Host "\nTestando categorias:"
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $categories = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/categories/' -Method GET -Headers $headers
    Write-Host "Categorias encontradas: $($categories.Count)"
    $categories | ForEach-Object { Write-Host "- $($_.name)" }
} catch {
    Write-Host "Erro ao buscar categorias: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)"
    }
}

# Testar produtos
Write-Host "\nTestando produtos:"
try {
    $products = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/products/' -Method GET -Headers $headers
    Write-Host "Produtos encontrados: $($products.Count)"
    $products | Select-Object -First 5 | ForEach-Object { Write-Host "- $($_.name) - R$ $($_.price)" }
} catch {
    Write-Host "Erro ao buscar produtos: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)"
    }
}

# Testar criação de categoria
Write-Host "\nTestando criação de categoria:"
$newCategory = @{
    name = 'Teste'
    description = 'Categoria de teste'
    active = $true
} | ConvertTo-Json

try {
    $createdCategory = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/categories/' -Method POST -Body $newCategory -Headers $headers
    Write-Host "Categoria criada com sucesso: $($createdCategory.name)"
} catch {
    Write-Host "Erro ao criar categoria: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)"
    }
}