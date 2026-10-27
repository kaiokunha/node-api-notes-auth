# Feature de auth

## Dados
Teremos uma tabela de users com:
- email (unique)
- password (bcrypt)
- token (hash aleatório)

## Aspectos funcionais

As notas terão referência 1:N em notes.id_user = users.id (onDelete cascade)

A autorização vai funcionar por header authorization via middleware.

Teremos rotas /auth/register e /auth/login, com controller e service layer próprio.

Todas as rotas /notes são privadas a usuário logado.

A listagem de notas lista só as notas do usuário logado.
As rotas de notas individuais (/notes/:id) são restritas as notas do usuário logado (note ownership).