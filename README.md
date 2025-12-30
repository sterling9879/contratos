# Contrato.AI

Sistema completo de analise de contratos com Inteligencia Artificial.

## Funcionalidades

- **Analise de Contratos**: Upload de PDF/DOCX para analise automatica com IA
- **Identificacao de Riscos**: Score de risco de 0-100 e clausulas problematicas
- **Chat Contextual**: Tire duvidas sobre o contrato com assistente de IA
- **Geracao de Contratos**: Crie contratos a partir de templates

## Tecnologias

### Backend
- Node.js 20 + Express + TypeScript
- PostgreSQL 15 + Prisma ORM
- Google Gemini API (AI)
- JWT Authentication

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- Zustand (State Management)
- React Hook Form + Zod

### Infraestrutura
- Docker + Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt SSL

## Inicio Rapido (Desenvolvimento)

### Pre-requisitos
- Node.js 20+
- PostgreSQL 15+
- Chave da API do Gemini

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas configuracoes
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Deploy em Producao

### 1. Configure o servidor (Ubuntu 22.04)

```bash
# Clone o repositorio
git clone <repo-url> /var/www/contrato-ai
cd /var/www/contrato-ai

# Configure as variaveis de ambiente
cp .env.example .env
nano .env  # Edite com suas configuracoes

# Execute o script de deploy
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### 2. Configure SSL

```bash
sudo certbot --nginx -d seu-dominio.com.br
```

### 3. Reinicie os servicos

```bash
cd /var/www/contrato-ai
docker-compose restart
```

## Estrutura do Projeto

```
contrato-ai/
├── backend/           # API Node.js/Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── prompts/
│   │   ├── routes/
│   │   ├── types/
│   │   └── utils/
│   └── prisma/
├── frontend/          # Next.js App
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
├── docker-compose.yml
├── nginx.conf
└── deploy.sh
```

## API Endpoints

### Autenticacao
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Dados do usuario

### Contratos
- `POST /api/contracts/upload` - Upload de contrato
- `GET /api/contracts` - Listar contratos
- `GET /api/contracts/:id` - Detalhes do contrato
- `DELETE /api/contracts/:id` - Excluir contrato
- `POST /api/contracts/:id/analyze` - Analisar contrato
- `GET /api/contracts/:id/analysis` - Resultado da analise

### Chat
- `POST /api/contracts/:id/chat` - Enviar mensagem
- `GET /api/contracts/:id/chat` - Historico

### Geracao
- `POST /api/generate` - Gerar contrato
- `GET /api/generate/templates` - Listar templates

## Planos

| Recurso | FREE | PRO | BUSINESS |
|---------|------|-----|----------|
| Analises/mes | 3 | 50 | Ilimitado |
| Paginas max | 10 | 50 | 200 |
| Chat msgs/contrato | 10 | 100 | Ilimitado |
| Geracoes/mes | 1 | 20 | Ilimitado |

## Variaveis de Ambiente

### Backend
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/contrato_ai
JWT_SECRET=sua-chave-secreta
JWT_REFRESH_SECRET=sua-chave-refresh
GEMINI_API_KEY=sua-chave-gemini
PORT=3001
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Licenca

MIT
