# Todo: AmberLink no Figma

## Task 1: Gerar imagens de âmbar (ChatGPT/Codex)
- [x] 3 imagens minimalistas: pedra de âmbar facetada, gota/esfera de resina translúcida, textura abstrata de âmbar com luz
- [x] Salvas em `design-system/amberlink/assets/*.png`
- Verificação: abrir cada PNG e conferir estilo minimalista, tons laranja, fundo claro
- Dependências: nenhuma · Escopo: S

## Task 2: Criar arquivo Figma + tokens
- [x] Arquivo novo com páginas Cover / Components / Home — Bento
- [x] Coleção de variáveis `AmberLink` com cores, raios e espaçamentos (scopes explícitos)
- Verificação: retorno do script com contagem de variáveis
- Dependências: nenhuma · Escopo: S

## Checkpoint A
- [x] Imagens aprovadas visualmente; tokens criados

## Task 3: Tela de Componentes
- [x] Paleta (swatches com nome + hex), escala tipográfica (Display/H1/H2/Body/Caption)
- [x] Componente Button com variantes (Primary/Secondary/Ghost/Amber Glass × Default/Hover)
- [x] Componente Card com variantes (Solid / Amber Glass / Image)
- [x] Tags/chips
- Verificação: screenshot sem texto cortado ou sobreposição
- Dependências: 2 (e 1 para card Image) · Escopo: M

## Task 4: Home em bento grid
- [x] Desktop 1440: nav, hero bento (nome, frase, imagem âmbar), cards de projetos, sobre, contato
- [x] Usa instâncias dos componentes da Task 3
- Verificação: screenshot final
- Dependências: 3 · Escopo: M

## Checkpoint final
- [ ] Revisão visual com o usuário

## Task 5: Home v2 (feedback: menos âmbar solto, mais presença)
- [x] Âmbar reduzido a 2 momentos: pedra grande no hero + faixa da fita abrindo os projetos
- [x] Capas reais dos projetos (Beauty Clinic, Fruit Ninja, Flash Cards) em layout assimétrico 1+2
- [x] Crazy Lab trocado por AmberLink; eyebrows numerados e travessões removidos
- [ ] Revisão do usuário

## Task 6: Botões maiores + Home v3 full-bleed (Figma)
- [x] Button: altura ~55-58px, label 17px, padding 32/28 (todas as instâncias herdaram)
- [x] Home v3: nav, hero, áreas/sobre, faixa âmbar, contato e rodapé em 100% da largura

## Fase 2 (código + Three.js): ver tasks/plan.md, tarefas T6-T12
