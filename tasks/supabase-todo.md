# Tarefas ativas: migração do portfólio para Supabase

As tarefas 1 e 2 foram aplicadas e verificadas; consulte `tasks/historico/supabase-data-access.md`. Os arquivos SQL correspondentes estão em `supabase/migrations/`.

## Tarefa 3: compartilhar o cliente Supabase

- [x] Criado um serviço singleton usado pelo login, guard e serviços de dados.
- [x] A sessão usa o armazenamento padrão persistente do SDK no navegador.
- [x] Inicialização do cliente continua restrita ao navegador.
- [ ] Executar `npm run build` e verificar login/sessão no navegador.

## Tarefa 4: leitura pública de cases e categorias

- [x] Home e projetos usam consultas diretas; cases e categorias inativos são filtrados.
- [x] O filtro usa as categorias ativas do banco e os cases mantêm categoria legível e `categoryId`.
- [ ] Conferir home, `/projects`, filtro e ordenação em navegador.
- [ ] Executar `npm run build`.

## Tarefa 5: CRUD lógico de categorias

- [x] Serviço de listar, criar, editar, desativar e reativar categorias criado.
- [x] `updated_at` é mantido pelo banco; a desativação de categoria usada por case ativo é bloqueada.
- [ ] Exercitar o ciclo CRUD no painel com a conta administradora.

## Tarefa 6: painel de categorias

- [x] Criada a rota protegida `/admin/categories`, com listagem, formulário e estado ativo/inativo.
- [x] A interface não oferece exclusão física.
- [ ] Conferir redirecionamento sem sessão e ações do painel com a conta administradora.

## Tarefa 7: CRUD administrativo de cases

- [x] Painel usa Supabase diretamente, seleciona categoria ativa e desativa/reativa por `ativo`.
- [x] Capas novas ou substituídas são enviadas ao Storage; validações atuais foram mantidas.
- [ ] Conferir criação, edição, desativação, reativação e upload no navegador.

## Tarefa 8: migrar as capas existentes

- [x] Bucket e políticas estão configurados.
- [ ] Enviar as cinco capas atuais (`beauty-clinic`, `mothers-day`, `flashcards-app`, `fruitninja`, `pacman-wpf`) ao bucket e atualizar `thumbnail_path`.
- [ ] Abrir as cinco imagens pelo portfólio e pelo painel.

Os registros ainda usam caminhos locais `/assets/projects/...`, que continuam sendo servidos pelo frontend enquanto a migração das imagens não for feita. A conta precisa estar autenticada como administradora para enviar os arquivos.

## Tarefa 9: remover transporte HTTP do Angular

- [x] Removidos `PortfolioApiService`, interceptor, provider `HttpClient` e referências a `API_BASE_URL` no código/configuração ativa.
- [x] Busca por endpoints ASP.NET e `HttpClient` em `src`, configuração pública e documentação não encontrou referências.
- [ ] Confirmar com `npm run build`.

## Tarefa 10: deploy e documentação

- [x] Docker, template de configuração, `.env.example` e README usam apenas URL e chave pública do Supabase.
- [x] Nenhuma chave secreta foi adicionada ao frontend.
- [ ] Validar a imagem Docker e a configuração no runtime.

## Tarefa 11: remover a coluna textual antiga

- [ ] Aplicar a migração contract removendo `portfolio_cases.category` somente depois de confirmar que nenhum outro consumidor da API .NET depende dela.

## Bloqueios de verificação

- O ambiente desta sessão não tem `node`, `npm` ou `docker`; build e verificação da imagem não puderam ser executados.
- A migração das capas exige uma sessão Auth administrativa ativa. Nenhuma credencial foi encontrada ou exposta neste checkout.
- A coluna antiga permanece até confirmar se existem outros consumidores da API ASP.NET.
