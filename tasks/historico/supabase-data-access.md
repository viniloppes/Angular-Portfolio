# Histórico: base de dados e políticas do portfólio

## Tarefa 1: migração aditiva de categorias

- [x] Criada `public.portfolio_categories` com UUID, nome, descrição nullable, timestamps e estado `ativo` 0/1.
- [x] Adicionados `category_id` e `ativo` em `portfolio_cases`; a coluna textual `category` foi mantida.
- [x] Categorias migradas: Campaign, Game, Interactive e Web.
- [x] Verificação remota: 5 cases preservados, 0 `category_id` nulos e 4 categorias associadas.
- [x] Migração aplicada: `20261007140549_portfolio_categories_expand`.

## Tarefa 2: RLS e políticas de acesso

- [x] Leituras públicas limitadas a cases e categorias ativos.
- [x] A conta Auth existente foi identificada pelo UID `829615e0-72aa-4ba3-9d99-96d25391dfc4`; apenas ela pode inserir ou atualizar os registros.
- [x] Grants de `anon` e `authenticated` não incluem `DELETE` nas tabelas do portfólio.
- [x] Testes transacionais: `anon` e usuário autenticado não administrador tiveram insert negado; a identidade administradora conseguiu inserir e desativar um case, com rollback após cada teste.
- [x] A desativação de categoria com cases ativos foi rejeitada pelo banco.
- [x] A política pública permissiva preexistente foi removida e as políticas de leitura consolidadas.
- [x] Bucket público `portfolio-covers` configurado para imagens de até 10 MB; políticas de escrita são restritas ao UID administrador. Nenhuma permissão global de outros buckets foi alterada.
- [x] Performance advisor sem avisos após consolidar as políticas.

## Migrações aplicadas ao projeto Supabase

- `20260927195455_portfolio_cases` (baseline existente do projeto)
- `20261007140549_portfolio_categories_expand`
- `20261007140632_portfolio_access_policies`
- `20261007140754_portfolio_cases_restrict_public_read`
- `20261007140801_portfolio_storage_policies`
- `20261007141545_portfolio_select_policy_consolidation`

Os arquivos correspondentes estão em `supabase/migrations/`. O projeto mantém um aviso independente: a proteção de senha vazada do Supabase Auth está desativada.
