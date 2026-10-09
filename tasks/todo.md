# Tarefas em andamento

## AmberLink no Figma

- [ ] Revisar visualmente o arquivo Figma com o usuário.
- [ ] Revisar com o usuário as alterações da Home v2.

O trabalho concluído de design está em `tasks/historico/amberlink-figma.md`.

## AmberLink no código

As tarefas de tokens, interface e Three.js continuam descritas em `tasks/plan.md`, Fases 2A e 2B.

### Extensão: conteúdo, movimento e jogos

- [x] T13: Preparar os quatro WebP fornecidos em `public/amberlink` e otimizar o maior.
- [x] T14: Ampliar a narrativa da Home com fatos do currículo, epígrafe atribuída e imagens/movimento em seções diferentes.
- [x] T15: Unificar a regra para cases jogáveis HTTPS em contador, selo e modal.
- [x] T16: Criar `/games` a partir dos cases jogáveis; manter `/projects` completo e destacar Snake em `/game`.
- [x] T17: Remover o botão de apagar progresso do Snake e manter a coleção existente.

Implementação concluída. `npm run build` passou; `/games`, `/projects` e os quatro recursos WebP responderam HTTP 200 no servidor local. O maior WebP passou de 3.022.142 para 373.596 bytes.

## Migração para Supabase

Consulte `tasks/supabase-todo.md` para tarefas ativas. As migrações e verificações concluídas estão em `tasks/historico/supabase-data-access.md`.
