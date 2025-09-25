# 🚀 Deploy Guide: Vercel + MongoDB Atlas + Pusher

Este guia mostra como fazer deploy do UniwSwap usando arquitetura 100% serverless.

## 📋 **Arquitetura Final**

```
Frontend + API Routes (Vercel) ←→ MongoDB Atlas ←→ Pusher Channels
            ↓                        ↓              ↓
      React + TypeScript         Database        WebSocket
      Serverless Functions      512MB Free      Real-time
```

## 1️⃣ **Setup MongoDB Atlas (5 minutos)**

### **Criar Cluster:**
1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crie conta gratuita
3. **Create Deployment** → **M0 FREE**
4. Região: **AWS / us-east-1** (mais próximo)
5. Cluster Name: `uniwswap-cluster`

### **Configurar Acesso:**
1. **Database Access** → **Add New Database User**
   - Username: `uniwswap-user`
   - Password: (gere uma senha forte)
   - Database User Privileges: **Read and write to any database**

2. **Network Access** → **Add IP Address**
   - **Allow access from anywhere**: `0.0.0.0/0`
   - (Para produção, restrinja aos IPs do Vercel)

### **Obter Connection String:**
1. **Connect** → **Connect your application**
2. **Driver**: Node.js
3. **Version**: 5.5 or later
4. Copie a connection string:
```
mongodb+srv://uniwswap-user:<password>@uniwswap-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 2️⃣ **Setup Pusher (5 minutos)**

### **Criar App:**
1. Acesse [pusher.com](https://pusher.com)
2. Crie conta gratuita
3. **Create app**:
   - Name: `uniwswap-channels`
   - Cluster: `us2`
   - Tech stack: **React** (frontend) + **Node.js** (backend)

### **Obter Credenciais:**
1. **App Keys** → Copie:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

## 3️⃣ **Deploy no Vercel (10 minutos)**

### **Opção 1: Via GitHub (Recomendado)**

1. **Fork/Push** seu código para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. **New Project** → **Import Git Repository**
4. Selecione seu repo `uniwswap-demo`
5. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### **Opção 2: Via CLI**

```bash
# Na pasta frontend
npm install -g vercel
vercel login
vercel --prod
```

### **Configurar Environment Variables:**

No dashboard do Vercel, vá em **Settings** → **Environment Variables**:

```env
# MongoDB
MONGODB_URI=mongodb+srv://uniwswap-user:SUA_SENHA@uniwswap-cluster.xxxxx.mongodb.net/uniwswap?retryWrites=true&w=majority

# Pusher Server (para API Routes)
PUSHER_APP_ID=123456
PUSHER_KEY=abcdef123456
PUSHER_SECRET=abcdef123456789
PUSHER_CLUSTER=us2

# Pusher Client (para React)
VITE_PUSHER_KEY=abcdef123456
VITE_PUSHER_CLUSTER=us2
```

## 4️⃣ **Estrutura de Arquivos**

```
frontend/
├── lib/
│   ├── mongodb.js          # Conexão MongoDB
│   ├── pusher.js           # Configuração Pusher Server
│   ├── utils.js            # Utilitários compartilhados
│   └── models/
│       └── Session.js      # Modelo MongoDB
├── pages/
│   └── api/                # Vercel API Routes
│       ├── sessions.js     # POST /api/sessions
│       ├── submit-email.js # POST /api/submit-email
│       ├── submit-password.js # POST /api/submit-password
│       └── admin/
│           ├── sessions.js      # GET /api/admin/sessions
│           └── request-email.js # POST /api/admin/request-email
├── src/
│   ├── hooks/
│   │   └── useSession.js   # Hook para gerenciar sessões
│   ├── services/
│   │   └── pusher.js       # Cliente Pusher
│   └── pages/
│       ├── LandingPage.tsx # Página principal
│       └── AdminDashboard.tsx # Dashboard admin
└── vercel.json             # Configuração Vercel
```

## 5️⃣ **Testando o Deploy**

### **URLs de Teste:**
```bash
# Frontend
https://your-app.vercel.app

# API Health Check
https://your-app.vercel.app/api/sessions

# Admin Dashboard
https://your-app.vercel.app/admin
```

### **Logs e Debug:**
1. **Vercel Dashboard** → **Functions** → **View Logs**
2. **MongoDB Atlas** → **Monitoring** → **Real Time**
3. **Pusher Dashboard** → **Debug Console**

## 6️⃣ **Comandos Úteis**

### **Deploy Local para Teste:**
```bash
# Instalar dependências
cd frontend
npm install

# Rodar em modo dev (com API Routes)
vercel dev

# Build para produção
npm run build

# Deploy
vercel --prod
```

### **Logs e Monitoring:**
```bash
# Ver logs em tempo real
vercel logs --follow

# Listar deployments
vercel ls

# Rollback se necessário
vercel rollback [deployment-url]
```

## 7️⃣ **Custos (GRATUITO)**

- **Vercel**: 100GB bandwidth, builds ilimitados
- **MongoDB Atlas**: 512MB storage (cluster M0)
- **Pusher**: 100 conexões simultâneas, 200K mensagens/dia
- **Total**: **R$ 0,00/mês** 🎉

## 8️⃣ **Performance**

### **Otimizações Automáticas:**
- ✅ **Edge Functions**: APIs rodam próximo aos usuários
- ✅ **Global CDN**: Frontend distribuído mundialmente  
- ✅ **Auto-scaling**: Escalabilidade infinita
- ✅ **Cold start**: ~100ms para wake up

### **Métricas Esperadas:**
- **TTI (Time to Interactive)**: ~2-3s
- **API Response Time**: ~200-500ms
- **WebSocket Latency**: ~50-150ms

## 🚨 **Troubleshooting**

### **Erros Comuns:**

1. **MongoDB Connection Failed**
   ```bash
   # Verificar IP whitelist e senha
   # Network Access → 0.0.0.0/0
   ```

2. **Pusher Not Connecting**
   ```javascript
   // Verificar VITE_PUSHER_KEY nas env vars
   console.log('Pusher Key:', import.meta.env.VITE_PUSHER_KEY)
   ```

3. **API Routes 500 Error**
   ```bash
   # Ver logs: Vercel Dashboard → Functions → Logs
   vercel logs --follow
   ```

## ✅ **Checklist Final**

- [ ] MongoDB Atlas cluster criado e conectando
- [ ] Pusher app configurado e testado
- [ ] Environment variables definidas no Vercel
- [ ] Deploy funcionando
- [ ] Frontend carregando
- [ ] API Routes respondendo
- [ ] WebSocket conectando via Pusher
- [ ] Admin dashboard funcionando

**🎯 Projeto pronto para produção em arquitetura serverless!**