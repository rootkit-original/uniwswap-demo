# 🚀 UniwSwap Deploy Setup Script (PowerShell)
# Este script ajuda a configurar o deploy automático no Windows

Write-Host "🚀 UniwSwap Deploy Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na pasta correta
if (-not (Test-Path "fly.toml") -or -not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Execute este script na pasta raiz do projeto" -ForegroundColor Red
    Write-Host "   Certifique-se de estar em c:\uniwswap\meu-projeto\site" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Projeto encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar dependências
Write-Host "🔍 Verificando dependências..." -ForegroundColor Blue

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale em: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar CLI tools (opcional)
Write-Host "🔍 Verificando CLI tools..." -ForegroundColor Blue

try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI não encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "   Instale com: npm i -g vercel" -ForegroundColor Gray
}

try {
    flyctl version | Out-Null
    Write-Host "✅ Fly CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Fly CLI não encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "   Instale em: https://fly.io/docs/getting-started/installing-flyctl/" -ForegroundColor Gray
}

Write-Host ""

# Verificar GitHub CLI (opcional)
try {
    gh --version | Out-Null
    Write-Host "✅ GitHub CLI encontrado" -ForegroundColor Green
    Write-Host "   Você pode configurar secrets com: gh secret set SECRET_NAME" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  GitHub CLI não encontrado (opcional)" -ForegroundColor Yellow
    Write-Host "   Instale em: https://cli.github.com" -ForegroundColor Gray
}

Write-Host ""

# Instalar dependências do projeto
Write-Host "📦 Instalando dependências..." -ForegroundColor Blue

Write-Host "  → Backend..." -ForegroundColor Gray
Set-Location backend
if (Test-Path "package.json") {
    npm install
    Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Backend package.json não encontrado" -ForegroundColor Red
}
Set-Location ..

Write-Host "  → Frontend..." -ForegroundColor Gray
Set-Location frontend
if (Test-Path "package.json") {
    npm install
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Frontend package.json não encontrado" -ForegroundColor Red
}
Set-Location ..

Write-Host ""

# Testar build
Write-Host "🔨 Testando build..." -ForegroundColor Blue
Set-Location frontend
try {
    npm run build
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
    if (Test-Path "dist") {
        $buildFiles = (Get-ChildItem -Path "dist" -Recurse).Count
        Write-Host "  → Build files: $buildFiles files" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
}
Set-Location ..

Write-Host ""

# Verificar workflows
Write-Host "📋 Verificando workflows..." -ForegroundColor Blue
if (Test-Path ".github/workflows/deploy-simple.yml") {
    Write-Host "✅ Deploy workflow encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ Deploy workflow não encontrado" -ForegroundColor Red
}

Write-Host ""

# Informações sobre secrets
Write-Host "🔐 PRÓXIMOS PASSOS - Configurar Secrets:" -ForegroundColor Magenta
Write-Host ""
Write-Host "No GitHub, vá em Settings → Secrets and variables → Actions"
Write-Host "e adicione estes secrets:"
Write-Host ""
Write-Host "1. VERCEL_TOKEN" -ForegroundColor Yellow
Write-Host "   → Obter em: https://vercel.com/account/tokens"
Write-Host ""
Write-Host "2. VERCEL_ORG_ID e VERCEL_PROJECT_ID" -ForegroundColor Yellow
Write-Host "   → Execute: cd frontend; npx vercel link"
Write-Host "   → Valores em: .vercel/project.json"
Write-Host ""
Write-Host "3. FLY_API_TOKEN" -ForegroundColor Yellow
Write-Host "   → Execute: flyctl auth token"
Write-Host ""

# Verificar git
try {
    $remotes = git remote -v 2>$null
    if ($remotes) {
        Write-Host "📡 Git remote configurado:" -ForegroundColor Blue
        Write-Host $remotes
    } else {
        Write-Host "⚠️  Git remote não configurado" -ForegroundColor Yellow
        Write-Host "   Configure com: git remote add origin <url>" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Git não configurado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Para fazer deploy:" -ForegroundColor Cyan
Write-Host "1. Configure os secrets no GitHub"
Write-Host "2. Faça push na branch main: git push origin main"
Write-Host "3. Monitore na aba Actions do GitHub"
Write-Host ""
Write-Host "📖 Leia mais em: .github/workflows/README.md" -ForegroundColor Gray