# 🔐 GitHub Secrets Setup Guide

Este guia explica como configurar os secrets necessários para o deploy automático do UniwSwap.

## 📋 Required Secrets

### 🌍 Vercel Secrets

1. **VERCEL_TOKEN**
   - Acesse: https://vercel.com/account/tokens
   - Clique em "Create Token"
   - Nome: `GitHub Actions - UniwSwap`
   - Scope: Full Account
   - Copie o token gerado

2. **VERCEL_ORG_ID**
   - No terminal, na pasta do frontend: `npx vercel link`
   - Após link, execute: `cat .vercel/project.json`
   - Copie o valor de `"orgId"`

3. **VERCEL_PROJECT_ID**
   - Mesmo arquivo `.vercel/project.json`
   - Copie o valor de `"projectId"`

### ☁️ Fly.io Secrets

4. **FLY_API_TOKEN**
   - Execute: `flyctl auth token`
   - Copie o token gerado

## 🔧 Como Adicionar Secrets no GitHub

1. Vá para o repositório no GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **"New repository secret"**
4. Adicione cada secret:

| Name | Description | Example |
|------|-------------|---------|
| `VERCEL_TOKEN` | Token de autenticação do Vercel | `vI8Gk7...[64 chars]` |
| `VERCEL_ORG_ID` | ID da organização/usuário Vercel | `team_abc123def456` |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel | `prj_abc123def456ghi789` |
| `FLY_API_TOKEN` | Token de API do Fly.io | `fo_abc123...[long string]` |

## 🚀 Environment Variables (Opcional)

Se você quiser configurar environment variables adicionais:

### Para Vercel:
- Configure diretamente no dashboard do Vercel
- **Settings** → **Environment Variables**

### Para Fly.io:
- Use: `flyctl secrets set VARIABLE_NAME="value"`
- Exemplo: `flyctl secrets set MONGODB_URI="mongodb+srv://..."`

## ✅ Verificação

Após configurar todos os secrets, faça um commit na branch `main` e verifique:

1. ✅ O workflow executa sem erros
2. ✅ Frontend é deployado no Vercel
3. ✅ Backend é deployado no Fly.io
4. ✅ Ambos os serviços estão funcionando

## 🛠️ Comandos Úteis

```bash
# Verificar configuração do Vercel localmente
npx vercel link
npx vercel env ls

# Verificar configuração do Fly.io
flyctl auth whoami
flyctl apps list
flyctl secrets list

# Testar workflows localmente (opcional)
# Install: https://github.com/nektos/act
act -j test
act -j deploy-frontend
```

## 🔍 Troubleshooting

### ❌ Vercel deployment falha:
- Verifique se `VERCEL_TOKEN` tem permissões corretas
- Confirme se `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` estão corretos
- Execute `npx vercel link` no diretório frontend

### ❌ Fly.io deployment falha:
- Verifique se `FLY_API_TOKEN` é válido: `flyctl auth whoami`
- Confirme se o app existe: `flyctl apps list`
- Verifique se o `fly.toml` está correto

### ❌ Build falha:
- Verifique dependências: `npm ci` em ambas as pastas
- Teste localmente: `npm run build` no frontend
- Cheque se todas as env vars estão configuradas

## 📝 Next Steps

Após configurar os secrets:

1. 🔄 Faça um push na branch `main`
2. 👀 Monitore o workflow na aba **Actions**
3. 🌍 Acesse sua aplicação nos links fornecidos
4. 🎉 Celebrate your successful deployment!

---

💡 **Tip**: Configure branch protection rules para garantir que apenas código testado seja deployado em produção.