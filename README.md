# API de CRUD de Notas

API REST simples em Node.js + TypeScript para gerenciar notas com autenticação por token opaco, ownership por usuário, PostgreSQL, Drizzle ORM e validação Zod.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Setup

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente (já existe `.env` no projeto; use o exemplo se precisar recriar):

```bash
cp .env.example .env
```

3. Suba o PostgreSQL:

```bash
docker compose up -d
```

4. Gere e aplique as migrations:

```bash
npm run db:generate
npm run db:migrate
```

> **Breaking change:** a migration adiciona a tabela `users` e a coluna `notes.id_user` (FK com cascade). Em desenvolvimento, se houver notas antigas sem dono, limpe/recrie o banco antes de migrar e rode o seed.

5. (Opcional) Popule usuários e notas de exemplo:

```bash
npm run db:seed
```

Usuários de exemplo: `demo@example.com` / `password123` e `alice@example.com` / `password123`.

6. Inicie a API em modo desenvolvimento:

```bash
npm run dev
```

A API fica disponível em `http://localhost:3000`.

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Sobe a API com hot reload (`tsx watch`) |
| `npm run build` | Compila TypeScript para `./dist` |
| `npm run db:generate` | Gera migrations a partir do schema |
| `npm run db:migrate` | Aplica migrations no banco |
| `npm run db:seed` | Insere usuários e notas de exemplo |

## Autenticação

A API usa token aleatório opaco (não JWT). No register/login o token é gerado, salvo em `users.token` e devolvido na resposta. Nas rotas de notas, envie:

```
Authorization: Bearer <token>
```

Cada login bem-sucedido gera um novo token e invalida o anterior. Todas as notas pertencem ao usuário autenticado (`notes.id_user`).

## Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/register` | Não | Criar usuário e obter token |
| `POST` | `/auth/login` | Não | Autenticar e obter token |
| `POST` | `/notes` | Sim | Criar nota do usuário logado |
| `GET` | `/notes` | Sim | Listar notas do usuário logado |
| `GET` | `/notes/:id` | Sim | Buscar nota do usuário logado |
| `PUT` | `/notes/:id` | Sim | Atualizar nota do usuário logado |
| `DELETE` | `/notes/:id` | Sim | Excluir nota do usuário logado |

### Exemplos

**Registrar**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Login**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
```

**Criar nota**

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Minha nota","content":"Conteúdo da nota"}'
```

**Listar notas**

```bash
curl http://localhost:3000/notes \
  -H "Authorization: Bearer <token>"
```

**Buscar por id**

```bash
curl http://localhost:3000/notes/<uuid> \
  -H "Authorization: Bearer <token>"
```

**Atualizar nota**

```bash
curl -X PUT http://localhost:3000/notes/<uuid> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Título atualizado","content":"Novo conteúdo"}'
```

**Excluir nota**

```bash
curl -X DELETE http://localhost:3000/notes/<uuid> \
  -H "Authorization: Bearer <token>"
```

## Variáveis de ambiente

| Variável | Exemplo |
|----------|---------|
| `PORT` | `3000` |
| `DATABASE_URL` | `postgresql://notes:notes@localhost:6000/notes` |
