# 🚢 SSH Deployment Setup

O workflow de deployment via SSH foi configurado com sucesso! Aqui estão as instruções para configurar os secrets no GitHub e executar o deployment.

## 📋 Secrets Obrigatórios no GitHub

Vá para **Settings → Secrets and variables → Actions** no seu repositório e adicione os seguintes secrets:

### 🔐 Credenciais SSH
- `DEPLOY_HOST`: `208.109.230.150`
- `DEPLOY_USER`: `mastered`
- `DEPLOY_PASSWORD`: `103020Aa@@`
- `DEPLOY_SUDO_PASSWORD`: `103020Aa@@`
- `DEPLOY_PORT`: `22` (opcional, padrão é 22)

### 🖥️ Configurações do Servidor
- `DEPLOY_BACKEND_PORT`: `3331`
- `DEPLOY_NODE_ENV`: `production`
- `DEPLOY_SERVICE_USER`: `mastered`
- `DEPLOY_SERVER_NAME`: `150.230.109.208.host.secureserver.net`

### 🗄️ Configurações Opcionais
- `DEPLOY_MONGODB_URI`: URI do MongoDB (se usar externo)
- `DEPLOY_FRONTEND_URL`: URL do frontend para CORS
- `DEPLOY_READY_TIMEOUT`: `45000` (timeout SSH em ms)

### 🔑 Chave SSH (Recomendado)
- `DEPLOY_SSH_KEY`: Chave privada SSH (mais seguro que senha)

## 🚀 Como Executar o Deployment

### Via GitHub Actions (Recomendado)
1. Vá para **Actions** no GitHub
2. Selecione "🚢 Deploy via SSH"
3. Clique em "Run workflow"
4. Configure as opções desejadas:
   - **Dry run**: Simula sem aplicar mudanças
   - **Skip build**: Pula build do frontend
   - **Skip frontend/backend**: Pula partes específicas

### Via Terminal Local
```bash
cd scripts
npm ci

# Dry run (recomendado primeiro)
DEPLOY_NON_INTERACTIVE=true \
DEPLOY_HOST=208.109.230.150 \
DEPLOY_USER=mastered \
DEPLOY_PASSWORD="103020Aa@@" \
DEPLOY_SUDO_PASSWORD="103020Aa@@" \
DEPLOY_BACKEND_PORT=3331 \
DEPLOY_NODE_ENV=production \
DEPLOY_SERVICE_USER=mastered \
DEPLOY_SERVER_NAME="150.230.109.208.host.secureserver.net" \
node deploy.js --non-interactive --dry-run

# Deployment real
node deploy.js --non-interactive
```

## 📁 O que o Script Faz

1. **Limpa conflitos**: Remove Apache/MongoDB para evitar conflitos
2. **Instala dependências**: curl, git, nginx, Node.js 18
3. **Configura backend**:
   - Empacota e faz upload do código
   - Instala dependências de produção
   - Configura serviço systemd
   - Inicia na porta 3331
4. **Configura frontend**:
   - Build e upload dos assets estáticos
   - Configura nginx como proxy reverso
5. **Valida**: Testa configuração e endpoints

## 🔧 Estrutura no Servidor

- **Backend**: `/opt/uniwswap/backend/`
- **Frontend**: `/var/www/uniwswap/`
- **Nginx**: `/etc/nginx/sites-available/uniwswap.conf`
- **Systemd**: `/etc/systemd/system/uniwswap-backend.service`
- **Logs**: `journalctl -u uniwswap-backend -f`

## 🎯 URLs Finais

- **Site**: http://150.230.109.208.host.secureserver.net/
- **API**: http://150.230.109.208.host.secureserver.net/api/
- **Health**: http://150.230.109.208.host.secureserver.net/api/health

## ✅ Status

- [x] Deploy script com modo não-interativo
- [x] GitHub Actions workflow configurado
- [x] Validação em dry-run bem-sucedida
- [x] Credenciais do servidor testadas
- [ ] Configurar secrets no GitHub (próximo passo)
- [ ] Executar primeiro deployment

## 🚨 Próximos Passos

1. **Configure os secrets** listados acima no GitHub
2. **Execute um dry-run** primeiro para validar
3. **Faça o deployment real** quando estiver satisfeito
4. **Monitore os logs** durante o primeiro deployment

O workflow está pronto para uso! 🎉