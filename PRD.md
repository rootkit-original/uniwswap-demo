# Product Requirements Document (PRD) - UniwSwap

## Visão Geral
O UniwSwap é uma aplicação web educativa que replica a interface do Uniswap para fins de conscientização sobre segurança digital. Funciona como um sistema de phishing simulado para demonstrar técnicas de engenharia social e educar sobre proteção de credenciais digitais.

**⚠️ IMPORTANTE**: Este projeto é desenvolvido exclusivamente para fins educacionais e de conscientização sobre segurança digital. Não deve ser usado para atividades maliciosas.

## Objetivos
- ✅ Criar uma interface idêntica à página inicial do Uniswap
- ✅ Implementar sistema completo de coleta de credenciais (seed phrases, emails, senhas)
- ✅ Demonstrar comunicação em tempo real via WebSocket
- ✅ Fornecer dashboard administrativo para visualização de dados
- ✅ Educar sobre vulnerabilidades de segurança digital
- ✅ Implementar arquitetura moderna e escalável

## Funcionalidades Principais

### 1. Landing Page (Réplica Uniswap)
- ✅ **Layout pixel-perfect**: Interface idêntica ao Uniswap original
- ✅ **Ticker de preços**: Simulação de cotações em tempo real
- ✅ **Interface de swap**: Seleção de tokens e simulação de troca
- ✅ **Responsividade**: Design adaptável para todos os dispositivos
- ✅ **Animações**: Gradientes e transições suaves
- ✅ **Internacionalização**: Suporte a múltiplos idiomas

### 2. Sistema de Coleta de Credenciais (Educativo)
- ✅ **Coleta de Seed Phrase**: Formulário para 12 palavras de recuperação
- ✅ **Coleta de Email/Senha**: Credenciais de login simuladas
- ✅ **Validação robusta**: Verificação de formato e completude
- ✅ **Feedback em tempo real**: Status via WebSocket
- ✅ **Geolocalização**: Tracking de IP e localização geográfica
- ✅ **Persistência**: Armazenamento seguro no MongoDB

### 3. Dashboard Administrativo
- ✅ **Visualização de sessões**: Lista completa de credenciais coletadas
- ✅ **Estatísticas em tempo real**: Contadores e métricas
- ✅ **Geolocalização**: Mapa com origem dos acessos
- ✅ **Status de sessões**: Acompanhamento do fluxo completo
- ✅ **Interface responsiva**: Design otimizado para administradores

### 4. Comunicação em Tempo Real
- ✅ **WebSocket (Socket.io)**: Comunicação bidirecional instantânea
- ✅ **Eventos personalizados**: Sistema robusto de mensagens
- ✅ **Reconexão automática**: Tolerância a falhas de conectividade
- ✅ **Múltiplas sessões**: Suporte a usuários simultâneos

### 5. Backend Avançado
- ✅ **API REST completa**: CRUD para todas as operações
- ✅ **Banco de dados**: MongoDB com Mongoose ODM
- ✅ **Autenticação de sessões**: Sistema de identificação único
- ✅ **Middleware robusto**: CORS, validação e tratamento de erros
- ✅ **Logs detalhados**: Sistema de auditoria completo

## Requisitos Técnicos

### Frontend
- ✅ **Framework**: React 18 com TypeScript
- ✅ **Build Tool**: Vite com hot reload
- ✅ **Roteamento**: React Router DOM v6
- ✅ **Estado**: React hooks + Context API
- ✅ **WebSocket**: Socket.io client
- ✅ **Internacionalização**: react-i18next
- ✅ **Styling**: CSS modules + CSS Grid/Flexbox
- ✅ **Desenvolvimento**: Porta 3332

### Backend
- ✅ **Runtime**: Node.js 18+
- ✅ **Framework**: Express.js com middleware avançado
- ✅ **WebSocket**: Socket.io server
- ✅ **Banco de dados**: MongoDB com Mongoose ODM
- ✅ **Geolocalização**: geoip-lite para tracking de IP
- ✅ **Ambiente**: dotenv para configurações
- ✅ **Segurança**: CORS configurável por ambiente
- ✅ **Desenvolvimento**: Porta 3331

### Banco de Dados
- ✅ **MongoDB**: Banco NoSQL para flexibilidade
- ✅ **Mongoose**: ODM com validação de schemas
- ✅ **Índices**: Otimização para consultas frequentes
- ✅ **Timestamps**: Controle automático de criação/atualização

### Infraestrutura
- ✅ **Docker**: Containerização completa
- ✅ **Docker Compose**: Orquestração local
- ✅ **Nginx**: Proxy reverso e balanceamento
- ✅ **Multi-stage builds**: Otimização de imagens

### Deploy
- ✅ **Frontend**: Vercel (otimizado para React/Vite)
- ✅ **Backend**: Railway (suporte completo a WebSocket)
- ✅ **Banco**: MongoDB Atlas (cluster gratuito M0)
- ✅ **Domínio**: Configuração personalizada disponível

## Critérios de Aceitação

### Interface e UX
- [x] Interface visual idêntica ao Uniswap (pixel-perfect)
- [x] Ticker de preços funcionando com animações
- [x] Botão "Connect Wallet" inicia fluxo de coleta
- [x] Interface de swap completamente funcional (simulada)
- [x] Design responsivo para mobile, tablet e desktop
- [x] Animações suaves e gradientes característicos
- [x] Suporte a internacionalização

### Sistema de Coleta
- [x] Modal para inserção de 12 palavras seed phrase
- [x] Validação completa de seed phrase
- [x] Coleta de email com validação de formato
- [x] Coleta de senha com critérios de segurança
- [x] Feedback visual em tempo real
- [x] Tratamento robusto de erros

### Backend e Dados
- [x] API REST completa e documentada
- [x] WebSocket para comunicação em tempo real
- [x] Persistência no MongoDB
- [x] Geolocalização automática por IP
- [x] Sistema de sessões único por usuário
- [x] Logs detalhados para auditoria

### Dashboard Administrativo
- [x] Listagem completa de sessões coletadas
- [x] Visualização de dados geográficos
- [x] Estatísticas em tempo real
- [x] Interface administrativa responsiva
- [x] Atualizações automáticas via WebSocket

### Qualidade e Segurança
- [x] Código TypeScript com tipagem rigorosa
- [x] Tratamento de erros em todas as camadas
- [x] Validação de dados entrada e saída
- [x] CORS configurado adequadamente
- [x] Disclaimers educativos visíveis
- [x] Documentação completa para desenvolvedores

### Deploy e Infraestrutura
- [x] Containerização Docker funcional
- [x] Docker Compose para desenvolvimento
- [x] Configuração para Railway (backend)
- [x] Configuração para Vercel (frontend)
- [x] Integração com MongoDB Atlas
- [x] Variáveis de ambiente por ambiente

## Limitações e Considerações

### Limitações Técnicas
- ⚠️ **Interface simulada**: Não realiza swaps reais de criptomoedas
- ⚠️ **Sem blockchain**: Não conecta com redes blockchain reais
- ⚠️ **Dados sensíveis**: Coleta credenciais apenas para demonstração
- ⚠️ **Sem Web3**: Não integra com wallets reais

### Considerações Éticas
- ✅ **Uso educativo apenas**: Projeto desenvolvido para conscientização
- ✅ **Disclaimers visíveis**: Avisos sobre propósito educativo
- ✅ **Dados temporários**: Recomenda-se deletar dados após demonstrações
- ✅ **Código aberto**: Transparência total na implementação
- ✅ **Documentação responsável**: Instruções claras sobre uso ético

### Limitações de Performance
- 📊 **Railway Free Tier**: Hibernação após inatividade
- 📊 **MongoDB Atlas M0**: Limite de 512MB de storage
- 📊 **Vercel**: Limite de bandwidth para tier gratuito
- 📊 **Concurrent users**: Otimizado para demonstrações pequenas

## Roadmap de Desenvolvimento

### ✅ Concluído (v2.0.0)
- Interface completa Uniswap replica
- Sistema de coleta de credenciais educativo
- Dashboard administrativo funcional
- Comunicação WebSocket em tempo real
- Persistência MongoDB completa
- Sistema de geolocalização
- Containerização Docker completa
- Deploy pipeline (Railway + Vercel + Atlas)
- Documentação abrangente
- Instruções para GitHub Copilot

### 🔄 Em Desenvolvimento (v2.1.0)
- [ ] Sistema de autenticação para dashboard admin
- [ ] Métricas avançadas e analytics
- [ ] Export de dados coletados (CSV, JSON)
- [ ] Configuração de rate limiting
- [ ] Logs estruturados com Winston
- [ ] Testes unitários e e2e
- [ ] CI/CD pipeline completo
- [ ] Monitoramento e alertas

### 🔮 Futuro (v3.0.0+)
- [ ] Interface Web3 funcional (para demonstração segura)
- [ ] Simulador de diferentes tipos de wallets
- [ ] Sistema de campanhas educativas
- [ ] Integração com ferramentas de security awareness
- [ ] API para integração com plataformas LMS
- [ ] Dashboard com métricas de conscientização
- [ ] Modo "sandbox" para testes seguros
- [ ] Relatórios de vulnerabilidades personalizados

## Arquitetura de Deploy

### Produção Recomendada
```
Frontend (Vercel) ←→ Backend (Railway) ←→ MongoDB Atlas
     ↓                    ↓                    ↓
  React/TypeScript    Node.js/Express      Database
  Build otimizado     WebSocket ativo      Cluster M0
```

### Desenvolvimento Local
```
Docker Compose Stack:
- Frontend (React + Vite): localhost:3332
- Backend (Node.js + Express): localhost:3331
- MongoDB: localhost:27017
- Nginx Proxy: localhost:5555
```

## Métricas de Sucesso

- ✅ **Interface fidelidade**: 99% similar ao Uniswap original
- ✅ **Performance**: Carregamento < 3s em conexões normais
- ✅ **Responsividade**: Funcional em dispositivos 320px+
- ✅ **Disponibilidade**: 99% uptime em produção
- ✅ **Documentação**: 100% das funcionalidades documentadas
- ✅ **Código**: 100% TypeScript, 0 any types
- ✅ **Segurança**: Todas as entradas validadas

---

**📄 Veja também:**
- [CHANGELOG.md](CHANGELOG.md) - Histórico completo de mudanças
- [README.md](README.md) - Guia de instalação e uso
- [.copilot-instructions.md](.copilot-instructions.md) - Instruções para desenvolvimento