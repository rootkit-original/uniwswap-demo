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

## 🧰 Provisionamento do servidor

Para (re)configurar um servidor Ubuntu/Debian limpo com Node.js, nginx e o site estático em `/var/www/html`, utilize o script `scripts/setup-server.sh`.

```bash
sudo bash scripts/setup-server.sh \
   --source /caminho/para/dist \
   --server-name exemplo.com
```

O script executa as seguintes etapas:

- remove o PM2 e qualquer instalação antiga do Node.js
- instala o Node.js 18.x via NodeSource
- reinstala e habilita o nginx
- limpa e recria os diretórios em `/etc/nginx/sites-available`/`sites-enabled`
- publica o conteúdo fornecido no web root (padrão `/var/www/html`) e aplica as permissões corretas
- reinicia o nginx já validando a configuração com `nginx -t`

Opções disponíveis:

- `--source` (opcional): diretório local com os arquivos estáticos a serem publicados
- `--web-root`: altera o diretório a servir (padrão `/var/www/html`)
- `--server-name`: define o `server_name` no nginx (padrão `_`)
- `--service-user`: usuário que receberá a posse dos arquivos publicados (padrão `www-data`)

Execute o script sempre como `root`/`sudo`. É seguro rodá-lo novamente caso precise reprovisionar a máquina.

## 🤖 Deploy automatizado com GitHub Actions

O fluxo de deployment agora é feito por um workflow self-hosted (`.github/workflows/deploy.yml`). Configure um runner local com acesso à sua rede/servidor e defina os seguintes *secrets* no repositório (Actions ➝ Repository secrets):

- `DEPLOY_HOST`, `DEPLOY_PORT` (opcional, padrão 22)
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY` (chave privada para o usuário remoto)
- `DEPLOY_SUDO_PASSWORD` (necessário para comandos `sudo`)
- `DEPLOY_BACKEND_PORT`, `DEPLOY_NODE_ENV`, `DEPLOY_SERVER_NAME`, `DEPLOY_SERVICE_USER` etc. conforme o ambiente

Com o runner ativo, acione o workflow manualmente na aba **Actions** ➝ *Self-Hosted Deploy* ➝ **Run workflow**. Você pode escolher pular o build do frontend ou do backend marcando os inputs `skip_frontend`/`skip_backend`.

O pipeline executa: checkout ➝ build do frontend ➝ empacotamento do backend ➝ geração dos arquivos `.env`, `systemd` e `nginx` ➝ upload via `scp` ➝ script remoto que instala dependências e reinicia os serviços. O processo substitui o uso manual do `scripts/deploy.js`.

## 📄 Licença

Este projeto é para fins educacionais e de demonstração.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
