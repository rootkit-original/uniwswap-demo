#!/bin/bash

# 🚀 UniwSwap Deploy Setup Script
# Este script ajuda a configurar o deploy automático

set -e

echo "🚀 UniwSwap Deploy Setup"
echo "======================="
echo ""

# Verificar se estamos na pasta correta
if [ ! -f "fly.toml" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Execute este script na pasta raiz do projeto"
    echo "   Certifique-se de estar em c:\\uniwswap\\meu-projeto\\site"
    exit 1
fi

echo "📁 Projeto encontrado!"
echo ""

# Verificar dependências
echo "🔍 Verificando dependências..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"
echo "✅ npm $(npm --version) encontrado"
echo ""

# Verificar CLI tools (opcional)
echo "🔍 Verificando CLI tools..."

if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI encontrado"
else
    echo "⚠️  Vercel CLI não encontrado (opcional)"
    echo "   Instale com: npm i -g vercel"
fi

if command -v flyctl &> /dev/null; then
    echo "✅ Fly CLI encontrado"
else
    echo "⚠️  Fly CLI não encontrado (opcional)"
    echo "   Instale em: https://fly.io/docs/getting-started/installing-flyctl/"
fi

echo ""

# Verificar GitHub CLI (opcional)
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI encontrado"
    echo "   Você pode configurar secrets com: gh secret set SECRET_NAME"
else
    echo "⚠️  GitHub CLI não encontrado (opcional)"
    echo "   Instale em: https://cli.github.com"
fi

echo ""

# Instalar dependências do projeto
echo "📦 Instalando dependências..."

echo "  → Backend..."
cd backend
if [ -f "package.json" ]; then
    npm install
    echo "  ✅ Backend dependencies installed"
else
    echo "  ❌ Backend package.json não encontrado"
fi
cd ..

echo "  → Frontend..."
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ❌ Frontend package.json não encontrado"
fi
cd ..

echo ""

# Testar build
echo "🔨 Testando build..."
cd frontend
if npm run build; then
    echo "✅ Frontend build successful"
    echo "  → Build files: $(ls -la dist/ 2>/dev/null | wc -l) files"
else
    echo "❌ Frontend build failed"
fi
cd ..

echo ""

# Verificar workflows
echo "📋 Verificando workflows..."
if [ -f ".github/workflows/deploy-simple.yml" ]; then
    echo "✅ Deploy workflow encontrado"
else
    echo "❌ Deploy workflow não encontrado"
fi

echo ""

# Informações sobre secrets
echo "🔐 PRÓXIMOS PASSOS - Configurar Secrets:"
echo ""
echo "No GitHub, vá em Settings → Secrets and variables → Actions"
echo "e adicione estes secrets:"
echo ""
echo "1. VERCEL_TOKEN"
echo "   → Obter em: https://vercel.com/account/tokens"
echo ""
echo "2. VERCEL_ORG_ID e VERCEL_PROJECT_ID"
echo "   → Execute: cd frontend && npx vercel link"
echo "   → Valores em: .vercel/project.json"
echo ""
echo "3. FLY_API_TOKEN"
echo "   → Execute: flyctl auth token"
echo ""

# Verificar git
if git remote -v &> /dev/null; then
    echo "📡 Git remote configurado:"
    git remote -v
else
    echo "⚠️  Git remote não configurado"
    echo "   Configure com: git remote add origin <url>"
fi

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "Para fazer deploy:"
echo "1. Configure os secrets no GitHub"
echo "2. Faça push na branch main: git push origin main"
echo "3. Monitore na aba Actions do GitHub"
echo ""
echo "📖 Leia mais em: .github/workflows/README.md"