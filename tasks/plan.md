# Plano: Identidade visual AmberLink (Figma)

## Visão geral
Criar no Figma a nova identidade do site, **AmberLink**: visual claro, tons de laranja/âmbar, layout em bento grid, minimalista, com elementos translúcidos que imitam resina de âmbar. Entregáveis: uma tela de **Componentes** (botões, cards, tipografia, cores) e uma tela **Home** em bento grid. As imagens de âmbar são geradas via ChatGPT (Codex CLI, `image_gen`).

## Decisões
- **Arquivo novo no Figma** ("AmberLink — Identidade"), no plano `team::1618040336878444710` (único plano da conta).
- **Tokens como variáveis Figma** (coleção `AmberLink`): cores (papel, superfície, tinta, tinta suave, âmbar 100–900, linha), raios (12 / 20 / 28 / pill), espaçamentos (4–64). Assim os componentes são ligados a tokens e migram fácil para o `styles.css`.
- **Tipografia**: display *Instrument Serif* ou *Fraunces* + corpo *Inter* (verificar disponibilidade com `listAvailableFontsAsync`; fallback Inter em tudo).
- **Âmbar translúcido**: no Figma, cards "glass" com preenchimento laranja ~35–55% de opacidade + `BACKGROUND_BLUR` + borda clara interna; sobre eles, imagens PNG de âmbar geradas (pedras/gotas de resina sobre fundo transparente ou creme).
- **Páginas Figma**: `Cover`, `Components`, `Home — Bento`.
- Nada é alterado no código Angular nesta etapa (só design). Migração para código é um plano futuro.

## Tarefas
Ver `tasks/todo.md`.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Codex não gerar PNG com transparência | Médio | Gerar sobre fundo creme liso (#FFF8EF) que casa com o papel do layout |
| Fonte display indisponível no Figma | Baixo | Fallback para Inter / outra serif disponível |
| Translucidez fraca em fundo claro | Médio | Colocar blobs de âmbar atrás dos cards glass para o blur ter o que refratar |

## Perguntas em aberto
- Manter "Crazy Lab"/"Vinícius Lopes" em algum lugar, ou AmberLink substitui totalmente? (PRODUCT.md hoje exige "Crazy Lab".) Assumido: AmberLink é a marca; nome "Vinícius Lopes" mantido no hero.

## Resultado
- Figma: https://www.figma.com/design/i8tMqSiTvDdwRxfHRS5L6N
- Fontes: Instrument Serif (display) + Geist (corpo) + Geist Mono (labels)

---

# Fase 2: AmberLink no código + imersão com Three.js

## Visão geral
Levar a Home v3 (full-bleed, botões maiores) para o Angular e adicionar dois momentos 3D em âmbar: a **pedra do hero** e as **fitas da faixa de projetos**, renderizados com Three.js. Os PNGs gerados pelo ChatGPT continuam sendo o fallback e o poster de carregamento.

## Decisões
- **Three.js puro** (`three` + `@types/three`), sem wrapper. O projeto é Angular, então React Three Fiber não se aplica, e `angular-three` adicionaria uma camada a mais para só duas cenas.
- **Só no navegador**: o app usa SSR (`@angular/ssr`). As cenas são criadas em `afterNextRender()` e carregadas por `import('three')` dinâmico, fora do bundle inicial.
- **Material de âmbar**: `MeshPhysicalMaterial` com `transmission: 1`, `ior: 1.54` (índice real do âmbar), `thickness`, `attenuationColor` laranja e `roughness` baixo; iluminação por `RoomEnvironment` + PMREM, sem HDR externo.
- **Poster primeiro**: o PNG atual aparece de cara (protege o LCP); o canvas entra com fade quando o primeiro frame estiver pronto.
- **Economia**: renderiza só quando visível (IntersectionObserver), `devicePixelRatio` limitado a 1.5, `dispose()` completo no destroy. Sem `window.addEventListener('scroll')`.
- **Fallback estático** (fica só o PNG) quando: `prefers-reduced-motion`, sem WebGL, ou tela < 768px.
- **Canvas decorativo**: `aria-hidden="true"`; todo conteúdo real continua em HTML.

## Tarefas

### Fase 2A: Base visual no código
- [ ] T6: Tokens AmberLink em `src/styles.css` (cores, raios, fontes Instrument Serif/Geist/Geist Mono self-hosted) substituindo a paleta violeta. M
- [ ] T7: Botões (≈58px de altura, label 17px, pill) e cards no padrão do Figma via tema PrimeNG/Tailwind. M
- [ ] T8: Home v3 em HTML/CSS: seções 100% largura, hero com PNG da pedra, faixa da fita, projetos 1+2, contato. Troca "Crazy Lab" por "AmberLink" nas rotas/títulos. M

### Checkpoint 2A
- [ ] `ng build` limpo, SSR renderiza a Home, layout confere com o frame Home v3 no Figma

### Fase 2B: Three.js (risco alto primeiro)
- [ ] T9: **Spike** do material de âmbar numa rota de teste (`/lab/amber`): pedra (icosaedro com ruído) com transmissão. Critério: ler como âmbar translúcido ao lado do PNG de referência. Rodar a ≥ 50 fps num notebook médio. S
- [ ] T10: Componente `AmberSceneComponent` reutilizável: lazy import, `afterNextRender`, pausa fora da tela, resize, dispose, fallback para poster. M
- [ ] T11: Pedra 3D no hero: rotação lenta + parallax leve do ponteiro (com amortecimento). Substitui o PNG após o primeiro frame. S
- [ ] T12: Fitas 3D na faixa de projetos: `TubeGeometry` em curvas Catmull-Rom com o mesmo material; movimento contínuo lento, progressão ligada à entrada da seção na tela. M

### Checkpoint 2B
- [ ] Lighthouse mobile: LCP < 2.5s, CLS < 0.1; bundle inicial sem `three`
- [ ] Reduced motion e mobile mostram só os PNGs
- [ ] Revisão visual com o usuário

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Transmissão pesada em GPU fraca | Alto | Spike primeiro (T9); `transmissionResolutionScale` 0.5; fallback mobile |
| SSR quebrar por acesso a `window` | Médio | Tudo dentro de `afterNextRender` + import dinâmico |
| 3D parecer "plástico" perto do PNG fotográfico | Médio | Comparar lado a lado no spike; se não convencer, usar o PNG com parallax em camadas (sem Three) |
| Bundle crescer (~600 KB do three) | Médio | Import dinâmico só na Home; tree-shaking via imports nomeados |

## Perguntas em aberto
- Imersão só nesses 2 momentos (proposta) ou também transições entre páginas / cursor interativo em 3D?

---

# Extensão: narrativa pessoal, paisagens Amber e jogos jogáveis

## Visão geral

Expandir o portfólio AmberLink com movimento mais expressivo, conteúdo pessoal confirmado no currículo e imagens WebP distribuídas por diferentes seções. Criar uma página dinâmica para jogos incorporados, sem reduzir o catálogo de projetos nem remover o Snake existente. Retirar da interface do Snake o botão que apaga o progresso salvo.

## Decisões

- Seguir a direção Editorial Luxury e a composição assimétrica em bento da skill high-end-visual-design, mantendo os tokens, fontes e identidade AmberLink já escolhidos.
- Usar as quatro imagens locais de D:\Users\lopes\Imagens\Amber em momentos e seções diferentes. Não prender uma única imagem ao fundo de toda a página; preferir camadas decorativas locais à seção e carregamento adequado ao tamanho.
- Aplicar movimentos lentos com transform e opacity, aproveitar IntersectionObserver e respeitar prefers-reduced-motion. Evitar animar dimensões e propriedades que refluem o layout.
- Manter um momento focal de entrada na Home, reveals já existentes e microinterações; o parallax de rolagem é melhoria progressiva com fallback estático. Não usar blur em reveals nem listeners contínuos de scroll.
- Usar fatos datados e verificáveis do currículo: MW Soluções (mar/2020–mar/2025), aplicações web/mobile/Windows, Angular, C#/.NET, WPF, APIs, MySQL, jogos com Unity, integração de hardware/Kinect e processamento de imagem. A formação em Jogos Digitais na FEBASP é prevista para dez/2026, não concluída. Não publicar telefone, e-mail ou WhatsApp, nem inventar métricas ou resultados.
- Usar como epígrafe uma tradução livre de “Programs must be written for people to read”, atribuída a Harold Abelson e Gerald Jay Sussman no prefácio de SICP. A frase liga programação ao cuidado com quem usa e mantém software. Fonte: [cópia do livro no MIT](https://web.mit.edu/6.001/6.037/sicp.pdf).
- Contar como jogável apenas um gameUrl HTTPS externo válido. Unificar essa regra no contador, no selo e na rota; links HTTP/inválidos não devem ser rotulados como jogáveis se o modal não puder incorporá-los.
- Criar /games usando os cases públicos ativos jogáveis e reutilizar CaseGallery, que já fornece o selo Jogável e o modal de iframe. A página começa com um destaque do Snake que aponta para /game.
- Rejeitar embeds da mesma origem do portfólio: o iframe atual combina allow-scripts e allow-same-origin, combinação que a [documentação do MDN desaconselha para conteúdo same-origin](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).
- Manter /projects como catálogo completo, /game como Snake e a gravação do progresso. Remover somente a ação visual de apagá-lo.
- Não adicionar dependências nem alterar o esquema do Supabase; o campo gameUrl e o fluxo de incorporação já existem.

## Tarefas

### Fase 2C: conteúdo e presença visual

#### T13: Preparar as quatro imagens WebP fornecidas

**Descrição:** Copiar galhos, pedra âmbar, folhas e fragmentos de âmbar para public/amberlink com nomes estáveis; medir e otimizar os arquivos mais pesados preservando o formato e a aparência.

**Critérios de aceitação:**
- [x] As quatro imagens são servidas a partir de public/amberlink e nenhuma URL do site aponta para o caminho local D:.
- [x] Os arquivos usados em seções abaixo da dobra têm carregamento adequado; o maior WebP foi otimizado sem perda visual perceptível.

**Verificação:** Abrir os quatro recursos servidos pelo site e conferir qualidade, dimensão e peso final.

**Dependências:** Nenhuma.

**Arquivos prováveis:** Quatro novos WebP em public/amberlink.

**Escopo estimado:** Pequeno.

#### T14: Completar a narrativa da Home e distribuir o movimento

**Descrição:** Ampliar a apresentação com fatos confirmados e datados do currículo, a epígrafe atribuída a Abelson e Sussman e as quatro cenas de âmbar/natureza em seções distintas da Home. Dar ênfase a um único momento focal na entrada, mantendo reveals e microinterações discretos.

**Critérios de aceitação:**
- [x] A Home apresenta experiência e áreas de atuação verificáveis no currículo, sem dados pessoais de contato ou resultados inventados.
- [x] As quatro imagens fornecidas aparecem em seções distintas, sem um único fundo fixo global; o movimento usa transform/opacity, não adiciona blur a conteúdo que rola e é desativado ou simplificado para movimento reduzido.
- [x] O conteúdo continua legível e sem sobreposição em telas móveis.
- [x] O reveal dos cards de cases interpola opacity/transform, sem ser anulado pela cascata de CSS.

**Verificação:** Executar npm run build e conferir a Home em viewport desktop, celular e com prefers-reduced-motion; inspecionar no DevTools a transição computada dos cards e o comportamento sem suporte a animation-timeline.

**Dependências:** T8 da Fase 2A e T13.

**Arquivos prováveis:** src/app/pages/home-page/home-page.ts, home-page.html, home-page.css, src/styles.css e src/app/components/case-gallery/case-gallery.css.

**Escopo estimado:** Médio.

### Checkpoint: narrativa visual

- [x] A Home exibe fatos e imagens locais em mais de uma seção, com movimento reduzido funcional.
- [x] Build e inspeção de conteúdo/recursos não indicam referência de imagem quebrada ou conteúdo sem contraste.

### Fase 2D: catálogo de jogos

#### T15: Unificar o critério de jogo incorporável

**Descrição:** Criar um predicado reutilizável que define um case como jogável somente quando possui URL HTTPS válida e externa. Aplicá-lo aos selos, à contagem pública e à galeria, e permitir que a rota de jogos abra o embed mesmo quando o case também tem vídeo.

**Critérios de aceitação:**
- [x] O contador, o selo e a seleção do catálogo usam a mesma regra; URL HTTP, malformada ou de mesma origem não aparece como jogável.
- [x] O modal continua priorizando vídeo por padrão em Projetos, mas pode abrir diretamente no jogo em /games.

**Verificação:** Executar npm run build e conferir cases HTTPS, HTTP, same-origin e com vídeo+jogo na contagem, selo e modal.

**Dependências:** Contrato existente PortfolioCase.gameUrl e CaseGallery.

**Arquivos prováveis:** Novo predicado em src/app/core/playable-case.ts, src/app/core/catalog-summary.ts e src/app/components/case-gallery/case-gallery.ts/.html.

**Escopo estimado:** Médio.

#### T16: Criar o catálogo dinâmico de jogos incorporados

**Descrição:** Adicionar /games para listar os cases públicos jogáveis com CaseGallery e apresentar o Snake como primeiro destaque, preservando sua tela atual em /game. O item Jogar da topbar leva ao catálogo.

**Critérios de aceitação:**
- [x] Todos os cases HTTPS jogáveis publicados aparecem na ordem do catálogo, sem lista duplicada; o modal abre direto no embed.
- [x] A página mostra estados de carregamento, erro e catálogo vazio; /projects continua completo e o Snake em /game continua jogável.
- [x] Um case novo com URL de jogo publicado no painel passa a aparecer sem alteração de código.

**Verificação:** Executar npm run build e conferir /games, embeds, link para Snake e lista completa em /projects.

**Dependências:** T15.

**Arquivos prováveis:** Novo games-page.ts e games-page.html, src/app/app.routes.ts e src/app/layout/topbar-menu/topbar-menu.html.

**Escopo estimado:** Médio.

#### T17: Remover o controle de apagar progresso do Snake

**Descrição:** Retirar o botão “Apagar progresso neste navegador” e o handler que só atendia esse botão, mantendo a coleta, a persistência e a exibição do progresso.

**Critérios de aceitação:**
- [x] O botão e sua chamada não aparecem mais em /game.
- [x] A coleção atual continua salva e visível depois da mudança.

**Verificação:** Executar npm run build e conferir visualmente a página Snake e seu estado de coleção.

**Dependências:** Nenhuma.

**Arquivos prováveis:** src/app/pages/game-page/game-page.html e game-page.ts.

**Escopo estimado:** Pequeno.

### Checkpoint: experiência de jogos

- [x] /games reflete os embeds publicados, sem limitar o catálogo completo em /projects.
- [x] /game mantém o Snake jogável e deixa de mostrar a ação de apagar progresso.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Os WebP somam cerca de 4,4 MB e um arquivo passa de 3 MB. | Alto | Otimizar cópias locais, carregar imagens abaixo da dobra sob demanda e evitar baixar todas no carregamento inicial. |
| Alguns sites bloqueiam iframe. | Médio | Reaproveitar o aviso e o link de abertura externa de CaseGallery. |
| O catálogo público pode ter game_url HTTP que hoje recebe selo Jogável sem funcionar no modal. | Médio | Unificar a validação HTTPS e confirmar no Supabase quantos registros existentes precisam de correção de URL. |
| A quantidade de embeds publicados ainda não foi consultada no Supabase. | Baixo | A página deriva do catálogo em tempo de execução e mantém o estado vazio sem inventar contagens. |
| A data do currículo pode ficar desatualizada. | Baixo | Usar fatos de experiência e áreas já confirmados; evitar apresentar a previsão de formação como conclusão. |

## Questões em aberto

- Nenhum bloqueio de implementação. A frase de SICP é uma tradução livre com autoria e fonte identificadas.
