# 🚀 Deploy Rápido - UniwSwap

## ⚡ Setup em 5 minutos

### 1️⃣ Pré-requisitos
- ✅ Conta no [GitHub](https://github.com)
- ✅ Conta no [Vercel](https://vercel.com) 
- ✅ Conta no [Fly.io](https://fly.io)

### 2️⃣ Obter Tokens

**Vercel:**
```bash
# 1. Vá em: https://vercel.com/account/tokens
# 2. Create Token → Nome: "GitHub Actions"
# 3. Copie o token
```

**Fly.io:**
```bash
flyctl auth login
flyctl auth token
# Copie o token gerado
```

**Vercel Project IDs:**
```bash
cd frontend
npx vercel link
# Siga as instruções para linkar o projeto
cat .vercel/project.json
# Copie orgId e projectId
```

### 3️⃣ Configurar Secrets no GitHub

1. Vá em: `Settings` → `Secrets and variables` → `Actions`
2. Clique em `New repository secret`
3. Adicione os 4 secrets:

| Nome | Valor |
|------|-------|
| `VERCEL_TOKEN` | Token do Vercel |
| `VERCEL_ORG_ID` | orgId do .vercel/project.json |
| `VERCEL_PROJECT_ID` | projectId do .vercel/project.json |
| `FLY_API_TOKEN` | Token do Fly.io |

### 4️⃣ Deploy!

```bash
git add .
git commit -m "feat: setup github actions deploy"
git push origin main
```

### 5️⃣ Monitorar

- 👀 Vá na aba **Actions** do GitHub
- 🔄 Aguarde o workflow terminar (~3-5 minutos)
- 🎉 Acesse sua aplicação nos URLs fornecidos!

---

## 🛠️ Scripts Úteis

### Windows (PowerShell):
```powershell
.\setup-deploy.ps1
```

### Linux/Mac:
```bash
chmod +x setup-deploy.sh
./setup-deploy.sh
```

---

## 📋 Checklist Rápido

- [ ] ✅ Node.js instalado
- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ Frontend faz build (`npm run build`)
- [ ] ✅ Contas criadas (GitHub, Vercel, Fly.io)
- [ ] ✅ Tokens obtidos
- [ ] ✅ Secrets configurados no GitHub
- [ ] ✅ Push na branch main
- [ ] ✅ Workflow executado com sucesso

---

## 🔍 Troubleshooting Rápido

**❌ Build falha:**
```bash
cd frontend && npm run build
# Veja o erro e corrija
```

**❌ Vercel falha:**
- Verifique tokens em vercel.com/account/tokens
- Execute: `cd frontend && npx vercel link`

**❌ Fly.io falha:**
- Execute: `flyctl auth whoami`
- Verifique: `flyctl apps list`

**❌ Workflow não executa:**
- Verifique se está na branch `main`
- Confirme que `.github/workflows/deploy-simple.yml` existe

---

## 🎯 URLs Depois do Deploy

- **Frontend**: https://seu-projeto.vercel.app
- **Backend**: https://uniwswap-backend.fly.dev  
- **Health Check**: https://uniwswap-backend.fly.dev/health

---

**💡 Dica**: Após o primeiro deploy, todos os pushes na branch `main` farão deploy automático!