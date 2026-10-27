# PRD — Autenticação e ownership de notas

Documento de requisitos para implementação da feature de auth sobre a API existente (feature `1-base`). Destinado a um agente de código: seguir este PRD como fonte da verdade.

Pré-requisito: o CRUD de notas da feature base já está implementado e funcional.

---

## 1. Objetivo

Adicionar autenticação por **token aleatório opaco** persistido em `users.token` (sem JWT), registro/login de usuários e isolamento de notas por usuário (ownership), mantendo a arquitetura em camadas já usada no projeto (routes → controllers → services → db) e validação Zod.

---

## 2. Modelo de autenticação (obrigatório)

**Não usar JWT.** Não assinar, não decodificar payload, não usar `jsonwebtoken` / libs equivalentes.

Fluxo canônico:

1. **Login (e register):** gerar um token aleatório seguro → salvar em `users.token` → retornar o token na resposta.
2. **Request autenticada:** cliente envia o token no header `Authorization: Bearer <token>`.
3. **Middleware `requireAuth`:** extrai o token → consulta `users` onde `token = <valor>` → se achar, anexa o usuário em `req.user` → `next()`; senão → `401`.

O token é uma string opaca (ex.: hex de `crypto.randomBytes`). A sessão efetiva é o valor em `users.token`. Cada login bem-sucedido **gera um novo token**, grava no banco e invalida o anterior (rotação simples).

```
POST /auth/login
  → valida email/senha
  → token = randomBytes(...)
  → UPDATE users SET token = token
  → response { id, email, token }

Request /notes/*
  → Authorization: Bearer <token>
  → SELECT * FROM users WHERE token = <token>
  → req.user = { id, email }
```

---

## 3. Escopo

### Incluído

- Tabela `users` (email único, password com bcrypt, `token` aleatório opaco)
- FK `notes.id_user` → `users.id` com `onDelete: cascade`
- Rotas `POST /auth/register` e `POST /auth/login` com controller e service próprios
- Middleware de autenticação via header `Authorization` validando `users.token`
- Todas as rotas `/notes` exigem usuário autenticado
- Listagem de notas retorna apenas notas do usuário logado
- Rotas de nota individual (`/notes/:id`) restritas ao dono da nota (ownership)
- Migration Drizzle para o novo schema
- Ajuste do seed para criar usuário(s) e notas vinculadas
- Dependências `bcrypt` (e types se necessário)

### Fora de escopo

- **JWT** (incluindo libs como `jsonwebtoken`, `jose`, etc.)
- Refresh tokens / sessão em cookie / Redis / store externa de sessão
- Logout (invalidação de token) — opcional; não implementar a menos que seja trivial e pedido
- Recuperação de senha, verificação de e-mail, roles/permissões
- Paginação, filtros ou busca
- Soft delete
- Testes automatizados
- Frontend
- Deploy / CI/CD
- Alterar stack, Docker, scripts existentes (exceto adicionar deps necessárias)

---

## 4. Modelo de dados

### Entidade: `users` (nova)

| Campo      | Tipo        | Restrições                                                                 |
|------------|-------------|----------------------------------------------------------------------------|
| `id`       | UUID        | PK, gerado automaticamente                                                 |
| `email`    | text/string | obrigatório, único                                                         |
| `password` | text/string | obrigatório; armazenar **hash bcrypt**, nunca plain text                   |
| `token`    | text/string | nullable até o primeiro login/register; string aleatória opaca da sessão   |

- `token` **não** é JWT: é o valor literal gerado e comparado por igualdade no banco.
- Índice em `token` é recomendável para lookup do middleware (opcional mas desejável).

Nome da coluna no DB: preferir inglês (`email`, `password`, `token`).

### Entidade: `notes` (alteração)

| Campo     | Tipo | Restrições                                                                 |
|-----------|------|----------------------------------------------------------------------------|
| `id`      | UUID | PK (já existe)                                                             |
| `title`   | text | obrigatório (já existe)                                                    |
| `content` | text | obrigatório (já existe)                                                    |
| `id_user` | UUID | FK → `users.id`, `notNull`, `onDelete: cascade`                            |

Relação: **1 usuário : N notas** (`notes.id_user = users.id`).

Schema Drizzle em: `src/db/schema.ts` (estender o arquivo existente; não criar schema paralelo).

### Migration

- Gerar e aplicar migration com `npm run db:generate` e `npm run db:migrate`.
- Como a base já pode ter notas sem `id_user`, a migration deve ser coerente: em ambiente de desenvolvimento, aceitável dropar/recriar ou limpar dados se necessário; documentar no README se houver breaking change no schema.
- Preferência: migration limpa (criar `users`, adicionar `id_user` em `notes` com FK). Se houver dados órfãos locais, o seed passa a ser a fonte de dados de exemplo.

---

## 5. API

Base URL e Content-Type inalterados.

### 5.1 Endpoints novos

| Método | Path             | Auth | Descrição                |
|--------|------------------|------|--------------------------|
| `POST` | `/auth/register` | Não  | Criar usuário            |
| `POST` | `/auth/login`    | Não  | Autenticar e obter token |

### 5.2 Endpoints existentes (comportamento alterado)

| Método   | Path         | Auth | Comportamento                                          |
|----------|--------------|------|--------------------------------------------------------|
| `POST`   | `/notes`     | Sim  | Cria nota vinculada ao usuário autenticado             |
| `GET`    | `/notes`     | Sim  | Lista **somente** notas do usuário autenticado         |
| `GET`    | `/notes/:id` | Sim  | Retorna nota se existir **e** pertencer ao usuário     |
| `PUT`    | `/notes/:id` | Sim  | Atualiza nota se existir **e** pertencer ao usuário    |
| `DELETE` | `/notes/:id` | Sim  | Exclui nota se existir **e** pertencer ao usuário      |

### 5.3 Autenticação (header)

- Header: `Authorization: Bearer <token>`
- O `<token>` é o valor opaco armazenado em `users.token` (não decodificar, não verificar assinatura).
- Middleware: extrai o token → `findUserByToken(token)` (lookup na tabela `users`) → anexa `req.user` com pelo menos `{ id, email }`.
- Sem token, formato inválido, ou nenhum usuário com aquele `token` → `401`.

### 5.4 Contratos — Auth

#### `POST /auth/register`

**Body (Zod):**
```json
{
  "email": "string (obrigatório, email válido)",
  "password": "string (obrigatório, min 6)"
}
```

**Comportamento:**
1. Validar body.
2. Verificar se `email` já existe → `409`.
3. Hash da senha com bcrypt.
4. Gerar token aleatório seguro (ex.: `crypto.randomBytes`).
5. Inserir usuário com `email`, `password` (hash), `token`.
6. Responder sem expor o hash da senha.

**Resposta `201`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "token": "..."
}
```

**Resposta `409`:** `{ "error": "Email already in use" }`

#### `POST /auth/login`

**Body (Zod):**
```json
{
  "email": "string (obrigatório, email válido)",
  "password": "string (obrigatório, min 1)"
}
```

**Comportamento:**
1. Buscar usuário por email.
2. Se não existir ou senha inválida (bcrypt.compare) → `401` com mensagem genérica (não revelar se o email existe).
3. Gerar **novo** token aleatório, persistir em `users.token` (rotação simples no login).
4. Retornar dados seguros + token.

**Resposta `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "token": "..."
}
```

**Resposta `401`:** `{ "error": "Invalid credentials" }`

### 5.5 Contratos — Notes (ajustes)

Respostas de sucesso mantêm o formato da nota. Incluir `id_user` no retorno é **recomendado** para consistência com o schema:

```json
{
  "id": "uuid",
  "title": "...",
  "content": "...",
  "id_user": "uuid"
}
```

#### `POST /notes`

- Body inalterado: `{ title, content }` (Zod min 1).
- Service associa `id_user` ao usuário autenticado (não aceitar `id_user` no body).

#### `GET /notes`

- Sem paginação.
- Filtrar por `id_user = req.user.id`.

#### `GET|PUT|DELETE /notes/:id`

- Params: UUID válido.
- Se a nota não existir **ou** não pertencer ao usuário → tratar como **`404`** `{ "error": "Note not found" }` (não vazar existência de notas de outros usuários).

### 5.6 Erros

| Situação                              | Status | Body sugerido                                      |
|---------------------------------------|--------|----------------------------------------------------|
| Validação Zod falhou                  | `400`  | `{ "error": "Validation error", "details": ... }`  |
| Sem auth / token inválido             | `401`  | `{ "error": "Unauthorized" }`                      |
| Credenciais inválidas (login)         | `401`  | `{ "error": "Invalid credentials" }`               |
| Email já cadastrado (register)        | `409`  | `{ "error": "Email already in use" }`              |
| Nota não encontrada / sem ownership   | `404`  | `{ "error": "Note not found" }`                    |
| Erro interno                          | `500`  | `{ "error": "Internal server error" }`             |

---

## 6. Arquitetura e estrutura de pastas

Estender a estrutura atual; não reinventar camadas.

```
src/
├── index.ts
├── app.ts
├── db/
│   ├── index.ts
│   ├── schema.ts              # users + notes (com id_user)
│   └── seed.ts                # usuário(s) + notas vinculadas
├── routes/
│   └── main.ts                # monta /auth e /notes; aplica auth nas notes
├── controllers/
│   ├── notes.ts               # ajustado: usa req.user
│   └── auth.ts                # NOVO
├── services/
│   ├── notes.ts               # filtrar/associar por userId; ownership
│   └── auth.ts                # NOVO: register, login, findByToken
├── schemas/
│   ├── notes.ts               # existente (sem id_user no body)
│   └── auth.ts                # NOVO: register/login Zod
└── middlewares/
    ├── validate.ts            # existente
    └── auth.ts                # NOVO: requireAuth
```

### Regras de camada (obrigatórias — manter padrão atual)

1. **Routes**: mapeiam método/path → middlewares → controller. Auth e Zod ficam na rota.
2. **Controllers**: leem `req` (incluindo `req.user`), chamam service, escrevem `res`. **Não** acessam o banco.
3. **Services**: toda interação com DB; **try/catch** em cada método; erros de domínio (`NotFoundError`, `ConflictError`, `UnauthorizedError` ou equivalentes) para o controller mapear status HTTP.
4. **Schemas**: validação Zod de body/params. Nenhuma request usa dados não validados.
5. **Middlewares**: `validate` (existente) e `requireAuth` (novo). Middleware de auth não contém regra de negócio de notes; só autentica e popula `req.user`.

### Tipagem de `req.user`

- Estender tipos do Express (ex.: `src/types/express.d.ts` ou declaração local) com `user?: { id: string; email: string }`.
- Manter simples; não criar framework de DI.

---

## 7. Detalhes de implementação

### 7.1 Password e token

- Usar `bcrypt` com cost factor razoável (ex.: `10`) — **somente para `password`**.
- Token de sessão: string aleatória criptograficamente segura (Node `crypto.randomBytes(32).toString("hex")` ou equivalente).
- Persistir o token **como gerado** em `users.token` (comparação por igualdade no middleware; não é JWT e não precisa de bcrypt no token).
- Nunca retornar `password` nas respostas.
- Nunca logar senha ou token em plain text em produção-minded code (evitar `console.log` de credenciais).

### 7.2 Service `auth`

Métodos sugeridos:

| Método                         | Responsabilidade                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| `register({ email, password })`| hash senha, gerar token, insert em `users`; Conflict se email duplicado          |
| `login({ email, password })`   | validar credenciais; gerar novo token; `UPDATE users.token`; retornar user+token |
| `findUserByToken(token)`       | `SELECT` em `users` por `token`; usado pelo middleware                           |

Erros de domínio sugeridos (classes simples, no estilo `NotFoundError` já usado em notes):

- `ConflictError` — email em uso
- `UnauthorizedError` ou reutilizar mensagem no controller para credenciais inválidas / token inválido

### 7.3 Service `notes` (ajustes)

Assinaturas passam a receber `userId` (do usuário autenticado):

- `createNote(userId, input)` — insert com `id_user`
- `findAllNotes(userId)` — `where eq(notes.id_user, userId)`
- `findNoteById(userId, id)` — filtrar por `id` **e** `id_user`; senão `NotFoundError`
- `updateNote(userId, id, input)` — idem ownership
- `deleteNote(userId, id)` — idem ownership

Não confiar em `id_user` vindo do client.

### 7.4 Middleware `requireAuth`

1. Ler header `Authorization`.
2. Extrair token no formato `Bearer <token>`.
3. Se ausente/malformado → `401`.
4. Buscar usuário com `findUserByToken(token)` (igualdade em `users.token`).
5. Se não achar → `401`.
6. Setar `req.user = { id, email }` e `next()`.

Não interpretar o token como JWT. A única fonte de verdade é a coluna `users.token`.

Aplicar em **todas** as rotas `/notes` (pode ser `router.use` no grupo de notes ou por rota — preferir agrupamento claro em `main.ts` para fácil manutenção).

### 7.5 Rotas

Em `src/routes/main.ts` (ou split mínimo se ficar legível):

- Rotas `/auth/*` **públicas**
- Rotas `/notes/*` protegidas com `requireAuth`

Manter um único entry de rotas se o arquivo continuar pequeno; só extrair `auth.ts` / `notes.ts` em `routes/` se melhorar clareza — não obrigatório.

### 7.6 Seed

Atualizar `src/db/seed.ts` para:

1. Criar pelo menos 1 usuário de exemplo (email/senha documentados no log ou comentário, ex.: `demo@example.com` / `password123`).
2. Inserir notas com `id_user` apontando para esse usuário.
3. Ideal: 2 usuários com notas distintas, para validar isolamento manualmente.

### 7.7 README

Atualizar `README.md` com:

- Endpoints `/auth/register` e `/auth/login`
- Explicar que o token retornado é salvo em `users.token` e enviado em `Authorization: Bearer <token>`
- Exemplos curl atualizados
- Dependência/conceito de users + ownership (breve)

---

## 8. Stack e dependências adicionais

Já existentes (não trocar): Express, Drizzle, Zod, pg, TypeScript, tsx, drizzle-kit.

**Adicionar:**

| Pacote            | Uso                          |
|-------------------|------------------------------|
| `bcrypt`          | hash/compare de senha        |
| `@types/bcrypt`   | types (devDependency)        |

**Proibido neste PRD:** `jsonwebtoken`, `jose`, Passport, Redis, ou qualquer store de sessão externa.

---

## 9. Critérios de aceite

A feature está pronta quando:

1. Schema possui `users` (com coluna `token`) e `notes.id_user` com FK + cascade; migration gera/aplica com os scripts existentes.
2. `POST /auth/register` cria usuário, gera e persiste token em `users.token`, retorna `201` com `id`, `email`, `token` (sem password); email duplicado → `409`.
3. `POST /auth/login` gera novo token, salva em `users.token` e retorna; credenciais erradas → `401`.
4. Middleware autentica **somente** via lookup `users.token` (sem JWT); rotas `/notes` sem token válido → `401`.
5. Criar nota associa automaticamente ao usuário autenticado.
6. `GET /notes` lista só notas do usuário logado.
7. Acessar/editar/excluir nota de outro usuário → `404` (não `403`).
8. Controllers não acessam DB; services com try/catch; Zod em body/params de auth e notes.
9. Middleware de auth isolado e reutilizável; anexa `req.user` após validar token na tabela.
10. Seed cria usuário(s) + notas vinculadas.
11. `npm run build` passa sem erros de TypeScript.
12. README documenta auth por token em banco e exemplos com Bearer.
13. Código segue o padrão atual do projeto (nomes em inglês, camadas, estilo simples).
14. Nenhuma dependência JWT foi adicionada.

---

## 10. Ordem sugerida de implementação

1. Adicionar dependências `bcrypt` / `@types/bcrypt`
2. Atualizar `src/db/schema.ts` (`users` com `token` + `id_user` em `notes`)
3. `db:generate` + `db:migrate`
4. Schemas Zod de auth
5. Service de auth (register, login, findUserByToken) + erros de domínio
6. Controller de auth + rotas públicas `/auth`
7. Middleware `requireAuth` (lookup em `users.token`) + tipagem `req.user`
8. Ajustar service/controller/rotas de notes (userId + ownership + proteção)
9. Atualizar seed
10. Atualizar README
11. Validar manualmente: register → login → token no header → CRUD isolado → token inválido → tentativa cross-user

---

## 11. Notas para o agente implementador

- Preferir nomes em inglês no código (`users`, `email`, `password`, `token`, `id_user`, `requireAuth`).
- **Não usar JWT.** Token aleatório em `users.token` é o mecanismo único de sessão.
- Não adicionar features fora deste PRD.
- Reutilizar padrões existentes (`NotFoundError`, middleware `validate`, estrutura de controllers/services).
- Manter o código simples e legível; sem over-engineering (sem strategy pattern, sem container de DI).
- Ownership falho deve responder `404`, não `403`, para não vazar IDs de notas alheias.
- Se houver ambiguidade, preferir a opção mais simples que ainda cumpra os critérios de aceite.
- Atualizar apenas o necessário no código da feature base; não refatorar arquivos não relacionados.
