# PRD — API de CRUD de Notas

Documento de requisitos para implementação completa do projeto. Destinado a um agente de código: seguir este PRD como fonte da verdade.

---

## 1. Objetivo

Construir uma API REST simples em Node.js + TypeScript para gerenciar notas (CRUD completo), com PostgreSQL via Docker Compose, Drizzle ORM, validação Zod e arquitetura em camadas (routes → controllers → services → db).

---

## 2. Escopo

### Incluído

- CRUD de notas (criar, listar todas, buscar por id, editar, excluir)
- Validação de body/params/query com Zod
- PostgreSQL 17 via Docker Compose
- Migrations e seed com Drizzle
- Scripts npm (`dev`, `build`, `db:*`)
- Configuração TypeScript, `.env` / `.env.example`, `.gitignore`

### Fora de escopo

- Autenticação / autorização
- Paginação, filtros ou busca
- Soft delete
- Testes automatizados
- Frontend
- Deploy em produção / CI/CD

---

## 3. Modelo de dados

### Entidade: `notes`

| Campo     | Tipo        | Restrições                         |
|-----------|-------------|------------------------------------|
| `id`      | UUID        | PK, gerado automaticamente         |
| `title`   | text/string | obrigatório, não vazio             |
| `content` | text/string | obrigatório, não vazio (ver Zod)   |

Schema Drizzle em: `src/db/schema.ts`.

---

## 4. API

Base URL: `http://localhost:{PORT}` (PORT via `.env`, sugerir `3000`).

Content-Type: `application/json`.

### 4.1 Endpoints

| Método   | Path           | Descrição              |
|----------|----------------|------------------------|
| `POST`   | `/notes`       | Criar nota             |
| `GET`    | `/notes`       | Listar todas as notas  |
| `GET`    | `/notes/:id`   | Buscar nota por id     |
| `PUT`    | `/notes/:id`   | Atualizar nota         |
| `DELETE` | `/notes/:id`   | Excluir nota           |

Sem paginação em `GET /notes`.

### 4.2 Contratos

#### `POST /notes`

**Body (Zod):**
```json
{
  "title": "string (obrigatório, min 1)",
  "content": "string (obrigatório, min 1)"
}
```

**Resposta `201`:**
```json
{
  "id": "uuid",
  "title": "...",
  "content": "..."
}
```

#### `GET /notes`

**Resposta `200`:** array de notas (pode ser `[]`).

#### `GET /notes/:id`

**Params:** `id` UUID válido.

**Resposta `200`:** objeto nota.

**Resposta `404`:** nota não encontrada.

#### `PUT /notes/:id`

**Params:** `id` UUID válido.

**Body:**
```json
{
  "title": "string (obrigatório, min 1)",
  "content": "string (obrigatório, min 1)"
}
```

Atualiza `title` e `content`.

**Resposta `200`:** nota atualizada.

**Resposta `404`:** nota não encontrada.

#### `DELETE /notes/:id`

**Params:** `id` UUID válido.

**Resposta `204`:** sem body.

**Resposta `404`:** nota não encontrada.

### 4.3 Erros

| Situação                         | Status | Body sugerido                                      |
|----------------------------------|--------|----------------------------------------------------|
| Validação Zod falhou             | `400`  | `{ "error": "Validation error", "details": ... }`  |
| Nota não encontrada              | `404`  | `{ "error": "Note not found" }`                    |
| Erro interno (ex.: DB)           | `500`  | `{ "error": "Internal server error" }`             |

---

## 5. Arquitetura e estrutura de pastas

```
.
├── .docs/
│   ├── brain-dump.md
│   └── prd.md
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # bootstrap Express + listen
    ├── app.ts                   # create app, middlewares, monta rotas (opcional mas recomendado)
    ├── db/
    │   ├── index.ts             # client Drizzle + conexão
    │   ├── schema.ts            # tabela notes
    │   └── seed.ts              # seed de notas de exemplo
    ├── routes/
    │   └── main.ts              # define rotas e liga aos controllers
    ├── controllers/
    │   └── notes.ts             # handlers HTTP (req/res); sem queries SQL
    ├── services/
    │   └── notes.ts             # lógica de negócio + acesso ao DB via Drizzle
    └── schemas/
        └── notes.ts             # schemas Zod (body, params)
```

### Regras de camada (obrigatórias)

1. **Routes** (`src/routes/main.ts`): apenas mapeiam método/path → controller; podem aplicar middleware de validação Zod.
2. **Controllers** (`src/controllers`): leem `req`, chamam service, escrevem `res`. **Não** executam consultas ao banco.
3. **Services** (`src/services`): toda interação com o banco. Usar **try/catch** em cada método; relançar ou retornar erros de forma tratável pelo controller.
4. **Schemas** (`src/schemas`): validação Zod de body, params (e query se houver). Nenhuma request usa dados não validados.

---

## 6. Stack e configuração técnica

### 6.1 Dependências (sugeridas)

**Runtime / app:**
- `express`
- `drizzle-orm`
- `postgres` (driver) **ou** `pg` — escolher um e manter consistente com o Drizzle
- `zod`
- `dotenv` (se não usar apenas `--env-file` do Node; o script `dev` usa env-file)

**Dev:**
- `typescript`
- `tsx`
- `drizzle-kit`
- `@types/express`
- `@types/node`
- `@types/pg` (se usar `pg`)

### 6.2 Scripts `package.json`

| Script         | Comportamento                                                                 |
|----------------|-------------------------------------------------------------------------------|
| `dev`          | `tsx watch` no entrypoint, carregando env via `--env-file=.env` (Node 20+)   |
| `build`        | `tsc` com `outDir: ./dist`                                                    |
| `db:generate`  | `drizzle-kit generate`                                                        |
| `db:migrate`   | aplicar migrations (drizzle-kit migrate ou script equivalente)                |
| `db:seed`      | executar `src/db/seed.ts` via `tsx` (com env-file)                            |

### 6.3 TypeScript (`tsconfig.json`)

- `strict: true`
- `outDir: ./dist`
- `rootDir: ./src` (ou equivalente coerente)
- Module resolution adequada para Node (`NodeNext` ou `CommonJS` — escolher um padrão e manter consistente em imports e `package.json` `"type"`)

### 6.4 Variáveis de ambiente

`.env` e `.env.example`:

```
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:6000/DB_NAME
```

Valores de USER/PASSWORD/DB_NAME devem bater com o `docker-compose.yml`.

### 6.5 Docker Compose

Arquivo: `docker-compose.yml`

- Imagem: PostgreSQL **17**
- Porta host: **6000** → container `5432`
- Volume nomeado para persistência dos dados
- Variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` alinhadas ao `DATABASE_URL`

### 6.6 Drizzle

- `drizzle.config.ts` apontando schema `src/db/schema.ts` e `DATABASE_URL`
- Pasta de migrations gerada pelo `db:generate` (ex.: `drizzle/` ou `src/db/migrations/`)
- Seed em `src/db/seed.ts`: inserir pelo menos 2–3 notas de exemplo

### 6.7 `.gitignore`

Incluir no mínimo: `node_modules/`, `dist/`, `.env`, logs, arquivos de SO/editor comuns. **Não** ignorar `.env.example`.

---

## 7. Detalhes de implementação

### Validação

- Body de create/update: `title` e `content` strings com `.min(1)`
- Params `:id`: validar como UUID (`z.string().uuid()`)
- Em falha de validação, responder `400` com detalhes úteis (issues do Zod)

### Services

Cada função do service (create, findAll, findById, update, delete) deve:
- Envolver a operação em `try/catch`
- Usar Drizzle contra a tabela `notes`
- Em update/delete/findById: se não existir registro, sinalizar “not found” para o controller responder `404`

### Bootstrap

- `src/index.ts` (ou `app` + `index`): cria Express, `express.json()`, registra rotas de `src/routes/main.ts`, escuta em `PORT`
- Health check opcional (`GET /health` → `200`) — não obrigatório

### Seed

- Conectar com a mesma config do app
- Inserir notas de exemplo
- Encerrar o processo ao terminar (sucesso ou erro)

---

## 8. Critérios de aceite

O projeto está pronto quando:

1. `docker compose up -d` sobe Postgres 17 na porta **6000** com volume.
2. `.env.example` documenta `PORT` e `DATABASE_URL`; `.env` local funciona.
3. `npm run db:generate` e `npm run db:migrate` criam/aplicam o schema.
4. `npm run db:seed` popula notas de exemplo.
5. `npm run dev` sobe a API.
6. Os 5 endpoints CRUD funcionam conforme a seção 4.
7. Requests inválidas retornam `400`; id inexistente retorna `404`.
8. Controllers **não** acessam o banco; services usam try/catch; Zod valida body/params.
9. `npm run build` gera saída em `./dist` sem erros de TypeScript.
10. Estrutura de pastas e arquivos bate com a seção 5.

---

## 9. Ordem sugerida de implementação

1. Inicializar projeto (`package.json`, `tsconfig`, `.gitignore`, `.env.example`)
2. `docker-compose.yml` + subir banco
3. Schema Drizzle + `drizzle.config.ts` + generate/migrate
4. Client DB (`src/db/index.ts`) + seed
5. Schemas Zod
6. Service de notas
7. Controller de notas
8. Rotas + bootstrap Express
9. Validar manualmente os endpoints e o `build`

---

## 10. Notas para o agente implementador

- Preferir nomes em inglês no código (`notes`, `title`, `content`, etc.).
- Não adicionar features fora deste PRD.
- Manter o código simples e legível; sem over-engineering.
- Se houver ambiguidade, preferir a opção mais simples que ainda cumpra os critérios de aceite.
