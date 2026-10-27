# Projeto: API de CRUD de Notas simples

## Aspectos funcionais
Cada nota será um registro com um titulo e um texto.
A API pode criar, ler todas (sem paginação), ler um, editar e excluir notas.

## Aspectos técnicos

Stack:
- Node + Typescript
- Express
- Drizzle ORM
- Zod
- Banco de dados PostgreSQL 17 no Docker Compose

O banco de dados roda em um docker-compose.yml com volume e na porta 6000.

O projeto tem .env e .env.example com:
- PORT
- DATABASE_URL

O package.json tem os scripts:
- dev (que usa tsx watch e env-file)
- build (que dá tsc com outDir na pasta ./dist)
- db:generate
- db:migrate
- db:seed

O schema do banco de dados estará em src/db/schema.ts e um seed em src/db/seed.ts

As rotas estarão em src/routes/main.ts, usando um controller para as notas que estará em src/controllers.

Todas as requisições tem body, params ou query validados pelo zod em schemas em src/schemas.

Nenhum controller roda consultas ao banco de dados, sendo todas as ações em service layer em src/services.

Os services usam try/catch.

O projeto tem tsconfig e gitignore apropriados para a stack.