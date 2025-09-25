# 🚀 GitHub Actions Deploy Workflow

Este diretório contém os workflows do GitHub Actions para deploy automático do UniwSwap.

## 📁 Arquivos

- `deploy-simple.yml` - Workflow principal de deploy (recomendado)
- `deploy.yml` - Workflow completo com testes (opcional)
- `preview.yml` - Deploy de preview para PRs

## 🎯 Workflow Principal: `deploy-simple.yml`

### Gatilhos:
- Push na branch `main`
- Execução manual via GitHub Actions

### Jobs:
1. **🔨 Build & Test** - Instala dependências e faz build do frontend
2. **🌍 Deploy Frontend** - Deploy no Vercel
3. **☁️ Deploy Backend** - Deploy no Fly.io
4. **📋 Summary** - Resumo do deployment

## 🔐 Secrets Necessários

Configure estes secrets no GitHub (Settings → Secrets and variables → Actions):

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `VERCEL_TOKEN` | Token de API do Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID da organização Vercel | `npx vercel link` → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | ID do projeto Vercel | Mesmo arquivo acima |
| `FLY_API_TOKEN` | Token de API do Fly.io | `flyctl auth token` |

## 🚀 Como Usar

1. **Configure os secrets** (veja seção acima)
2. **Faça push na branch main**:
   ```bash
   git add .
   git commit -m "feat: deploy setup"
   git push origin main
   ```
3. **Monitore o workflow** na aba "Actions" do GitHub
4. **Acesse sua aplicação** nos URLs fornecidos no summary

## 📋 Status Codes

| Status | Significado |
|--------|-------------|
| ✅ success | Deploy realizado com sucesso |
| ❌ failure | Falha no deploy - verifique logs |
| ⚠️ skipped | Job foi pulado (ex: não é branch main) |
| 🔄 in_progress | Deploy em andamento |

## 🛠️ Troubleshooting

### ❌ Vercel Deploy Falha
- Verifique se os secrets `VERCEL_*` estão corretos
- Execute localmente: `cd frontend && npx vercel link`
- Confirme se o build funciona: `npm run build`

### ❌ Fly.io Deploy Falha
- Verifique se `FLY_API_TOKEN` é válido
- Confirme se o app existe: `flyctl apps list`
- Teste localmente: `flyctl deploy`

### ❌ Build Falha
- Verifique `package.json` e dependências
- Teste localmente: `cd frontend && npm run build`
- Veja logs detalhados na aba Actions

## 🔧 Customização

### Adicionar Testes
Descomente as seções de teste no workflow:

```yaml
- name: 🧪 Run Tests
  run: |
    cd frontend
    npm test
```

### Deploy Condicional
Adicione condições para deployments específicos:

```yaml
if: contains(github.event.head_commit.message, '[deploy]')
```

### Ambientes Múltiplos
Configure branches diferentes para staging/production:

```yaml
on:
  push:
    branches: [ main, staging ]
```

## 📊 Monitoring

- **GitHub Actions**: Veja histórico de deploys na aba Actions
- **Vercel Dashboard**: Monitore frontend em vercel.com
- **Fly.io Dashboard**: Monitore backend em fly.io/dashboard

## 🎉 Success!

Após configurar tudo corretamente, cada push na branch `main` fará deploy automático de:
- ✅ Frontend no Vercel
- ✅ Backend no Fly.io
- ✅ Summary com links e status

---

**💡 Dica**: Use branch protection rules para garantir que apenas código revisado seja deployado em produção.