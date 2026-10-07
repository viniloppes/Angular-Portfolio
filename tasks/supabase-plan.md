# Plano: migrar o portfólio para acesso direto ao Supabase

## Intenção confirmada

- O Angular passa a consultar e editar projetos e categorias diretamente no Supabase; o fluxo do portfólio deixa de depender da API ASP.NET Core.
- Categorias terão tabela própria, com ID UUID, nome, descrição, created_at, updated_at e ativo (1 = ativo; 0 = inativo).
- portfolio_cases passa a referenciar portfolio_categories por category_id e também terá ativo. Exclusão será lógica; nenhum fluxo do aplicativo fará DELETE físico.
- Imagens de capa serão enviadas ao Supabase Storage. A tabela guardará o caminho do objeto, não o conteúdo da imagem.
- O login Supabase existente será mantido. A autorização efetiva de escrita será aplicada pelo RLS.

## Arquitetura e decisões

- Tabela nova: public.portfolio_categories. Os campos de data seguem o padrão atual created_at/updated_at. updated_at deve ser atualizado no banco.
- A migração será expand-contract: criar e preencher portfolio_categories e category_id primeiro, mantendo temporariamente a coluna textual category. Removê-la só depois da troca do frontend e da confirmação de que nenhum consumidor ainda depende da API antiga.
- As categorias atuais serão migradas a partir dos valores distintos existentes: Web, Campaign, Interactive e Game. Os IDs e demais dados de portfolio_cases serão preservados.
- As tabelas não expõem DELETE ao cliente. O administrador desativa e reativa registros alterando ativo; consultas públicas retornam apenas projetos ativos e categorias ativas.
- O cliente Angular usa a chave pública do Supabase com RLS. A política deve identificar o administrador autorizado especificamente; uma sessão autenticada ou o guard do Angular, isoladamente, não é autorização suficiente.
- O bucket de capas será público para leitura das imagens exibidas no portfólio, com gravação restrita ao administrador por políticas de Storage. O banco guarda o caminho do objeto e o cliente obtém a URL pública.
- O cliente Supabase será compartilhado com AdminAuthService para que login, guard e operações de dados usem a mesma sessão.
- As consultas de dados continuam no navegador, como hoje. O uso de Supabase não adicionará consultas autenticadas ao SSR.
- O escopo deste repositório é remover a dependência do ASP.NET no frontend. O código e a implantação do backend separado só serão desativados depois da validação e da confirmação de que não existem outros consumidores.

## Lista de tarefas

### Fase 1: dados e acesso seguro

- [x] Tarefa 1: Criar migração aditiva de categorias e exclusão lógica.
- [x] Tarefa 2: Configurar RLS, privilégios e políticas do Storage.
- [ ] Tarefa 3: Compartilhar o cliente Supabase com a autenticação.

### Ponto de controle: fundação

- [x] A migração mantém todas as linhas atuais e associa cada projeto à categoria correta.
- [x] Leituras públicas e escritas administrativas estão cobertas por políticas verificáveis.
- [ ] Login e sessão continuam usando o mesmo cliente Supabase.

### Fase 2: catálogo e categorias

- [ ] Tarefa 4: Ler projetos e categorias públicas pelo Supabase.
- [ ] Tarefa 5: Implementar acesso CRUD lógico às categorias.
- [ ] Tarefa 6: Criar a tela administrativa de categorias.

### Ponto de controle: leitura e categorias

- [ ] Home e projetos exibem somente registros ativos e preservam ordenação e filtros.
- [ ] O administrador consegue criar, editar, listar, desativar e reativar categorias.

### Fase 3: projetos, imagens e retirada da API

- [ ] Tarefa 7: Migrar o CRUD administrativo de projetos e o formulário de categoria.
- [ ] Tarefa 8: Criar bucket/políticas e migrar as capas atuais.
- [ ] Tarefa 9: Remover o transporte HTTP e a configuração de URL da API.
- [ ] Tarefa 10: Atualizar a configuração de deploy e a documentação.
- [ ] Tarefa 11: Remover a coluna textual antiga após o corte.

### Ponto de controle: corte concluído

- [ ] O frontend não chama endpoints ASP.NET nem depende de API_BASE_URL.
- [ ] Imagens e projetos atuais continuam visíveis pelo Supabase.
- [ ] Exclusão lógica, restauração e bloqueio de escrita para não administradores foram conferidos.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| O backend atual pode autorizar o administrador de um jeito que ainda não está codificado nas políticas RLS. | Alto | Resolvido: as políticas usam o UID da única conta Auth existente; inserts de anon e usuário não administrador foram rejeitados em transação. |
| Remover category antes do corte quebra a API antiga. | Alto | Manter a coluna textual na migração aditiva e removê-la somente após validar o frontend direto e confirmar os demais consumidores. |
| Os caminhos atuais de capa apontam para assets locais e não para Storage. | Médio | Enviar as cinco imagens existentes ao bucket, atualizar thumbnail_path e conferir as URLs antes de remover a dependência do backend. |
| A desativação de uma categoria pode deixar projetos ativos sem categoria visível. | Médio | Regra recomendada: bloquear a desativação enquanto houver projetos ativos associados; exigir reatribuição antes. Confirmar esta regra antes da implementação. |
| As categorias antigas não têm descrição no script fornecido. | Baixo | Não inventar textos; definir se a descrição começa vazia/nullable e pode ser preenchida no painel. |
| Pode haver outros consumidores da API .NET além deste frontend. | Médio | Retirar somente a dependência deste Angular e desativar a API após confirmar que nenhum outro cliente a utiliza. |

## Questões abertas para a implementação

- A conta Auth existente foi identificada pelo UID `829615e0-72aa-4ba3-9d99-96d25391dfc4`; as políticas RLS usam esse UID.
- As descrições começam vazias/null e podem ser preenchidas depois.
- A desativação de categoria com cases ativos é bloqueada no banco.
- Confirme se existe algum consumidor da API ASP.NET além deste Angular antes de remover a coluna `portfolio_cases.category`.

## Referências técnicas

- Supabase para Angular: https://supabase.com/docs/guides/getting-started/tutorials/with-angular
- Acesso frontend, grants e RLS: https://supabase.com/docs/guides/database/secure-data
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Upload de arquivos no navegador: https://supabase.com/docs/guides/storage/quickstart
- Controle de acesso do Storage: https://supabase.com/docs/guides/storage/security/access-control
