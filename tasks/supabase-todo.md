# Tarefas: migração do portfólio para Supabase

As tarefas abaixo implementam o plano em tasks/plan.md. Todas permanecem abertas até serem executadas e verificadas.

## Tarefa 1: Criar migração aditiva de categorias e exclusão lógica

**Descrição:** Criar a tabela portfolio_categories e adicionar category_id e ativo a portfolio_cases. Popular as categorias a partir dos valores atuais e associar os projetos sem remover a coluna textual antiga durante a fase de compatibilidade.

**Critérios de aceite:**
- [ ] portfolio_categories contém id UUID, name, description, created_at, updated_at e ativo com padrão 1 e valores válidos 0/1.
- [ ] portfolio_cases preserva os registros e passa a ter category_id e ativo; cada category_id corresponde ao valor category anterior.
- [ ] Nenhuma linha de projeto é apagada e a coluna category antiga permanece até a tarefa 11.

**Verificação:**
- [ ] Comparar contagem de portfolio_cases antes/depois e verificar ausência de category_id nulo.
- [ ] Conferir categorias migradas e projeto associado para cada valor distinto.

**Dependências:** Nenhuma.

**Arquivos prováveis:**
- supabase/migrations/202610070001_portfolio_categories_expand.sql

**Escopo estimado:** Pequeno.

## Tarefa 2: Configurar RLS, privilégios e políticas do Storage

**Descrição:** Restringir acesso direto do navegador. Tornar leituras públicas somente dos dados ativos, permitir escrita às categorias/projetos apenas para a conta administradora e preparar leitura pública/gravação administrativa das capas. Não expor operação de exclusão física ao aplicativo.

**Critérios de aceite:**
- [ ] anon lê somente projetos e categorias ativos; a conta administradora consegue listar também registros inativos.
- [ ] RLS e privilégios permitem insert/update apenas à identidade administrativa específica; usuário autenticado comum e anon não conseguem gravar.
- [ ] O cliente não recebe permissão de DELETE físico; Storage permite leitura pública das capas e escrita restrita à administração.

**Verificação:**
- [ ] Conferir as grants e políticas aplicadas para anon, authenticated e Storage.
- [ ] Tentar insert/update como anon, usuário não administrador e administrador; somente a conta autorizada deve gravar.

**Dependências:** Tarefa 1; requer definir UID ou claim administrativo antes de aplicar a política final.

**Arquivos prováveis:**
- supabase/migrations/202610070002_portfolio_access_policies.sql
- Configuração do bucket no Supabase

**Escopo estimado:** Pequeno.

## Tarefa 3: Compartilhar o cliente Supabase com a autenticação

**Descrição:** Extrair a criação do cliente Supabase para um serviço compartilhado. Fazer AdminAuthService e os serviços de dados usarem a mesma instância, configuração e armazenamento de sessão.

**Critérios de aceite:**
- [ ] Login, leitura do token, guard e operações de dados usam a mesma sessão Supabase.
- [ ] O cliente usa somente SUPABASE_URL e a chave pública já configurada; nenhuma chave secreta é incluída no frontend.
- [ ] Inicialização de dados continua restrita ao navegador, preservando o comportamento atual de SSR.

**Verificação:**
- [ ] Entrar no painel, consultar a sessão pelo serviço e confirmar uma chamada autenticada ao Supabase.
- [ ] Executar npm run build.

**Dependências:** Tarefa 2.

**Arquivos prováveis:**
- src/app/core/supabase-client.service.ts
- src/app/core/admin-auth.service.ts

**Escopo estimado:** Pequeno.

## Ponto de controle: fundação

- [ ] A migração preserva IDs e contagens.
- [ ] A política administrativa está definida por identidade, não somente por sessão autenticada.
- [ ] O cliente compartilhado mantém o fluxo de login existente.

## Tarefa 4: Ler projetos e categorias públicas pelo Supabase

**Descrição:** Substituir a leitura pública HTTP de projetos por uma consulta ao banco, retornando a categoria associada, ordenando pela posição existente e filtrando registros inativos.

**Critérios de aceite:**
- [ ] Home e projetos recebem apenas portfolio_cases ativos associados a categorias ativas, na ordem de sort_order.
- [ ] O modelo do frontend mantém o nome legível da categoria e o ID da categoria.
- [ ] Os estados atuais de carregamento, erro, galeria e filtro por categoria continuam funcionando.

**Verificação:**
- [ ] Conferir Home, /projects, filtro de categoria e ordem dos cards com dados do Supabase.
- [ ] Executar npm run build.

**Dependências:** Tarefas 1 e 3.

**Arquivos prováveis:**
- src/app/core/portfolio-api.service.ts
- src/app/core/portfolio-case.ts

**Escopo estimado:** Pequeno.

## Tarefa 5: Implementar acesso CRUD lógico às categorias

**Descrição:** Criar o modelo e o serviço de dados para listar, criar, editar, desativar e reativar categorias diretamente no Supabase.

**Critérios de aceite:**
- [ ] O serviço lista categorias ativas e inativas para administração e somente ativas para seletores públicos/administrativos.
- [ ] Criar/editar persiste nome, descrição e updated_at; desativar/reativar altera ativo sem executar DELETE.
- [ ] Erros de RLS e de validação são propagados para a interface de forma tratável.

**Verificação:**
- [ ] Criar e editar uma categoria; confirmar no Supabase os campos e timestamps.
- [ ] Desativar e reativar a categoria e confirmar que o registro permanece na tabela.

**Dependências:** Tarefas 1 e 3.

**Arquivos prováveis:**
- src/app/core/portfolio-category.ts
- src/app/core/portfolio-category.service.ts

**Escopo estimado:** Pequeno.

## Tarefa 6: Criar a tela administrativa de categorias

**Descrição:** Adicionar uma tela protegida pelo guard existente para administrar categorias, com nome, descrição, estado ativo/inativo e ações sem exclusão física.

**Critérios de aceite:**
- [ ] A rota /admin/categories exige a sessão administrativa existente e fica acessível pela navegação do painel.
- [ ] A tela permite listar, criar, editar, desativar e reativar categorias, com estados de carregamento, erro e sucesso.
- [ ] A interface deixa claro quando uma categoria está inativa e não apresenta exclusão irreversível.

**Verificação:**
- [ ] Acessar a rota sem sessão e confirmar redirecionamento ao login.
- [ ] Com a conta admin, executar o ciclo de criação, edição, desativação e reativação pela tela.

**Dependências:** Tarefa 5.

**Arquivos prováveis:**
- src/app/pages/admin-categories/admin-categories.ts
- src/app/pages/admin-categories/admin-categories.html
- src/app/pages/admin-categories/admin-categories.css
- src/app/app.routes.ts
- src/app/pages/admin-cases/admin-cases.html

**Escopo estimado:** Médio.

## Ponto de controle: leitura e categorias

- [ ] O catálogo público filtra somente projetos/categorias ativos sem alterar a apresentação existente.
- [ ] CRUD de categorias funciona pela tela e não envia DELETE.

## Tarefa 7: Migrar o CRUD administrativo de projetos

**Descrição:** Trocar as chamadas HTTP do painel por operações Supabase. Substituir a categoria digitada livremente por seletor baseado em categoria ativa, implementar soft delete/restauração e enviar capas novas/substituídas ao Storage.

**Critérios de aceite:**
- [ ] Criar/editar projeto grava category_id e os campos atuais do case; a capa salva seu caminho de Storage em thumbnail_path.
- [ ] Excluir altera ativo para 0 e a ação de reativar altera para 1; nenhum fluxo chama DELETE na tabela.
- [ ] Validações atuais de imagem, URLs, descrição e ordenação continuam aplicadas; erros PostgREST/Storage são exibidos sem tratar tudo como HttpErrorResponse.

**Verificação:**
- [ ] Criar, editar, desativar e reativar um projeto usando a interface administrativa.
- [ ] Confirmar category_id, ativo, updated_at e thumbnail_path no banco; abrir a capa retornada pelo Storage.

**Dependências:** Tarefas 4, 5 e 6.

**Arquivos prováveis:**
- src/app/core/portfolio-api.service.ts
- src/app/core/portfolio-case.ts
- src/app/pages/admin-cases/admin-cases.ts
- src/app/pages/admin-cases/admin-cases.html

**Escopo estimado:** Médio.

## Tarefa 8: Migrar as capas atuais para o Storage

**Descrição:** Configurar o bucket público de capas, enviar os arquivos locais atuais e substituir os caminhos locais em thumbnail_path pelos caminhos do bucket.

**Critérios de aceite:**
- [ ] As cinco capas existentes estão no bucket configurado, com tipos e limite de tamanho compatíveis com o formulário atual.
- [ ] Cada registro existente aponta para o caminho correto no Storage; os arquivos originais permanecem até a conferência.
- [ ] Leitura pública funciona e upload/alteração de arquivo exige a identidade administrativa.

**Verificação:**
- [ ] Abrir as cinco imagens pelo portfólio e pelo painel.
- [ ] Tentar upload como usuário não administrador e confirmar rejeição da política.

**Dependências:** Tarefas 2 e 7.

**Arquivos prováveis:**
- supabase/migrations/202610070003_portfolio_storage_policies.sql
- Configuração e conteúdo do bucket no Supabase

**Escopo estimado:** Pequeno.

## Tarefa 9: Remover transporte HTTP e configuração de API do código Angular

**Descrição:** Remover o interceptor que adiciona bearer token a /api/admin, o provider HttpClient se não houver outros consumidores, e apiBaseUrl do runtime config após todas as operações migrarem.

**Critérios de aceite:**
- [ ] O frontend não contém chamadas a /api/cases, /api/admin/cases ou configuração apiBaseUrl.
- [ ] Nenhum outro fluxo depende de HttpClient antes de remover o provider/interceptor.
- [ ] Auth guard, login e logout continuam operando pelo Supabase.

**Verificação:**
- [ ] Buscar no código por /api/cases, /api/admin, API_BASE_URL, apiBaseUrl e HttpClient; não deve restar dependência do portfólio na API antiga.
- [ ] Executar npm run build.

**Dependências:** Tarefas 4 e 7.

**Arquivos prováveis:**
- src/app/core/portfolio-config.ts
- src/app/app.config.ts
- src/app/core/auth.interceptor.ts

**Escopo estimado:** Pequeno.

## Tarefa 10: Atualizar configuração de deploy e documentação

**Descrição:** Remover API_BASE_URL dos exemplos e do template injetado pelo Docker, mantendo somente as configurações públicas do Supabase e explicando RLS/Storage para o deploy.

**Critérios de aceite:**
- [ ] Docker inicia sem API_BASE_URL e continua gerando runtime config com URL e chave pública do Supabase.
- [ ] README e .env.example descrevem a nova configuração e não sugerem configurar endpoint ASP.NET.
- [ ] Nenhuma chave service_role/secret é publicada em arquivo do frontend.

**Verificação:**
- [ ] Conferir template, script de entrypoint, .env.example, public config e README sem API_BASE_URL.
- [ ] Fazer build da imagem ou validar o script de configuração com as variáveis documentadas.

**Dependências:** Tarefa 9.

**Arquivos prováveis:**
- .env.example
- public/portfolio-config.js
- portfolio-config.js.template
- docker-entrypoint.d/40-portfolio-config.sh
- README.md

**Escopo estimado:** Médio.

## Tarefa 11: Remover a coluna textual antiga após o corte

**Descrição:** Depois que leitura e CRUD do Angular estiverem operando pelo Supabase e os consumidores externos forem descartados, remover portfolio_cases.category, agora substituída por category_id.

**Critérios de aceite:**
- [ ] A consulta pública e o painel usam category_id e o nome de portfolio_categories.
- [ ] Os valores antigos foram preservados na tabela portfolio_categories e nenhum projeto foi apagado.
- [ ] Nenhum consumidor ativo da API antiga depende da coluna textual antes de aplicar a migração final.

**Verificação:**
- [ ] Conferir todos os projetos e categorias após a migração final.
- [ ] Confirmar no navegador que home, filtro, detalhe, painel e capas seguem funcionando sem chamadas ASP.NET.

**Dependências:** Tarefas 4, 7, 8, 9 e 10; confirmação de que não há outros consumidores.

**Arquivos prováveis:**
- supabase/migrations/202610070004_portfolio_categories_contract.sql

**Escopo estimado:** Pequeno.

## Ponto de controle: corte concluído

- [ ] Build Angular concluído.
- [ ] Listagem pública, filtro de categorias, upload de capa e CRUD administrativo verificados.
- [ ] Acesso público limitado à leitura de registros ativos; conta admin é a única com escrita.
- [ ] Nenhuma operação do frontend apaga linhas ou depende da API ASP.NET.
