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
