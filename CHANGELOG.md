# CHANGELOG - UniwSwap Demo

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2025-09-25

### 🚀 Major Features Added
- **Sistema completo de phishing educativo** - Coleta de seed phrases, emails e senhas para fins de conscientização
- **Dashboard Administrativo** - Interface completa para visualização de dados coletados
- **Comunicação em tempo real** - Implementação de WebSocket com Socket.io
- **Persistência de dados** - Migração de armazenamento em memória para MongoDB
- **Geolocalização** - Tracking de IP e localização geográfica dos usuários
- **Sistema de sessões** - Gerenciamento completo do fluxo de coleta de credenciais
- **Internacionalização** - Suporte a múltiplos idiomas com react-i18next

### 🏗️ Architecture Changes
- **Backend expandido**: De simples API REST para sistema completo com WebSocket
- **Frontend reestruturado**: Múltiplas páginas (LandingPage + AdminDashboard)
- **Database**: Adicionado MongoDB com Mongoose ODM
- **Real-time communication**: Socket.io para atualizações instantâneas
- **Component architecture**: Estrutura modular para componentes React

### 📦 New Dependencies

#### Frontend
- `socket.io-client`: Comunicação WebSocket
- `react-i18next` + `i18next`: Sistema de internacionalização
- `react-router-dom`: Roteamento entre páginas

#### Backend
- `socket.io`: Servidor WebSocket
- `mongoose`: ODM para MongoDB
- `geoip-lite`: Geolocalização por IP
- `dotenv`: Gerenciamento de variáveis de ambiente

### 🐳 Infrastructure
- **Docker Compose** - Stack completa com MongoDB, Nginx, Frontend e Backend
- **Multi-stage builds** - Otimização de builds Docker
- **Nginx proxy** - Proxy reverso para roteamento
- **Environment configuration** - Configuração flexível por ambiente

### 📄 Documentation
- **Comprehensive README** - Documentação completa do projeto
- **Copilot Instructions** - Guia detalhado para desenvolvimento com GitHub Copilot
- **API Documentation** - Endpoints documentados
- **Docker setup** - Instruções de containerização

### 🔧 Development Experience
- **GitHub repository** - Repositório público configurado
- **Development scripts** - Scripts otimizados para desenvolvimento
- **Environment setup** - Configuração automática de ambiente

### 🌐 Deployment Ready
- **Railway backend** - Configuração para deploy no Railway
- **Vercel frontend** - Otimização para deploy no Vercel  
- **MongoDB Atlas** - Configuração para banco em nuvem
- **CORS configuration** - Configuração adequada para produção

---

## [1.0.0] - 2025-09-24 (Estado Inicial)

### ✨ Initial Release
- **Landing Page** - Interface básica inspirada no Uniswap
- **Email collection** - Modal simples para coleta de emails
- **Basic backend** - API REST simples com Express.js
- **In-memory storage** - Armazenamento temporário em memória
- **Basic UI** - Interface responsiva com CSS customizado

### 🛠️ Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js
- **Styling**: CSS modules
- **Build**: Vite para desenvolvimento rápido

### 📋 Features
- Interface visual similar ao Uniswap
- Modal "Coming Soon" para coleta de emails
- Validação básica de email
- API REST para armazenamento
- Design responsivo

### 🚧 Limitations
- Dados não persistentes
- Funcionalidade limitada
- Sem sistema de usuários
- Interface apenas simulada

---

## Versioning
Este projeto segue [Semantic Versioning](https://semver.org/):
- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades adicionadas de forma compatível
- **PATCH**: Correções de bugs compatíveis

## Categories
- 🚀 **Major Features** - Funcionalidades principais
- 🏗️ **Architecture** - Mudanças na arquitetura
- ✨ **Features** - Novas funcionalidades
- 🐛 **Bug Fixes** - Correções de bugs  
- 📄 **Documentation** - Melhorias na documentação
- 🔧 **Development** - Melhorias no desenvolvimento
- 🌐 **Deployment** - Configurações de deploy
- 📦 **Dependencies** - Atualizações de dependências