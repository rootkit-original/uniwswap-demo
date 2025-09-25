# UniwSwap

Uma plataforma de troca de criptomoedas inspirada no Uniswap, desenvolvida como projeto de demonstração com ReactJS + TypeScript no frontend e Node.js no backend.

## 🚀 Funcionalidades

- Interface idêntica à página inicial do Uniswap
- Modal "Coming Soon" para coleta de emails
- Backend API para gerenciamento de inscrições
- Design responsivo e moderno

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool rápido para desenvolvimento
- **CSS** - Estilização customizada

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para Node.js
- **CORS** - Middleware para compartilhamento de recursos
- **Body Parser** - Middleware para parsing de JSON

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

## 🔧 Instalação e Execução

### Backend

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

O servidor estará rodando em `http://localhost:3331`

### Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O frontend estará disponível em `http://localhost:3332`

## 📖 Uso

1. Abra o navegador e acesse `http://localhost:3332`
2. Visualize a interface inspirada no Uniswap
3. Clique no botão "Começar" na seção de swap
4. Preencha o modal "Coming Soon" com seu email
5. O email será enviado para o backend e armazenado

## 🏗️ Estrutura do Projeto

```
uniwswap/
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Componente principal
│   │   ├── App.css          # Estilos da aplicação
│   │   ├── main.tsx         # Ponto de entrada
│   │   └── index.css        # Estilos globais
│   ├── index.html           # HTML principal
│   ├── package.json         # Dependências frontend
│   └── vite.config.ts       # Configuração Vite
├── backend/
│   ├── index.js             # Servidor Express
│   └── package.json         # Dependências backend
├── PRD.md                   # Documento de requisitos
└── README.md                # Este arquivo
```

## 🔌 API Endpoints

### POST /subscribe
Cadastra um email para notificações.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Email subscribed successfully"
}
```

### GET /subscribers
Retorna a contagem de inscritos (para testes).

**Response:**
```json
{
  "count": 5,
  "emails": ["user1@example.com", "user2@example.com", ...]
}
```

## 🎨 Design

O design é uma réplica fiel da página inicial do Uniswap, incluindo:
- Header com navegação
- Interface de swap simulada
- Gradientes e cores características
- Tipografia e espaçamento consistentes

## 🚧 Limitações

- Armazenamento em memória (dados não persistem após restart)
- Interface simulada (não realiza swaps reais)
- Sem integração com blockchain
- Sem autenticação de usuários

## 📝 Desenvolvimento

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é para fins educacionais e de demonstração.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.