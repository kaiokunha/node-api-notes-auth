# API de CRUD de Notas

API REST simples em Node.js + TypeScript para gerenciar notas, com PostgreSQL, Drizzle ORM e validação Zod.

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

5. (Opcional) Popule notas de exemplo:

```bash
npm run db:seed
```

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
| `npm run db:seed` | Insere notas de exemplo |

## Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| `POST` | `/notes` | Criar nota |
| `GET` | `/notes` | Listar todas as notas |
| `GET` | `/notes/:id` | Buscar nota por id |
| `PUT` | `/notes/:id` | Atualizar nota |
| `DELETE` | `/notes/:id` | Excluir nota |

### Exemplos

**Criar nota**

```bash
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha nota","content":"Conteúdo da nota"}'
```

**Listar notas**

```bash
curl http://localhost:3000/notes
```

**Buscar por id**

```bash
curl http://localhost:3000/notes/<uuid>
```

**Atualizar nota**

```bash
curl -X PUT http://localhost:3000/notes/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"title":"Título atualizado","content":"Novo conteúdo"}'
```

**Excluir nota**

```bash
curl -X DELETE http://localhost:3000/notes/<uuid>
```

## Variáveis de ambiente

| Variável | Exemplo |
|----------|---------|
| `PORT` | `3000` |
| `DATABASE_URL` | `postgresql://notes:notes@localhost:6000/notes` |
