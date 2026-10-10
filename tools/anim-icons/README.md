# Ícones animados (sprite WebP + CSS)

Ícones que ficam parados e tocam uma animação curta no hover. Cada ícone é uma sprite WebP
com os frames lado a lado, usada como **máscara**: o arquivo fornece só a forma, e a cor vem
do CSS. O mesmo ícone serve em preto, branco, laranja ou qualquer cor, sem gerar outro arquivo.

## Uso

```html
<!-- Anima no hover do próprio ícone -->
<span class="anim-icon anim-icon--cube" aria-hidden="true"></span>

<!-- Anima no hover/foco de um elemento pai (card, link, botão) -->
<a class="anim-icon-trigger" href="/projects">
  <span class="anim-icon anim-icon--cube" aria-hidden="true"></span>
  Projetos
</a>
```

O ícone é decorativo: use `aria-hidden="true"` e deixe o texto acessível no elemento pai.

### Cor

A cor é `currentColor`, então o ícone herda a cor do texto ao redor.

```html
<span class="anim-icon anim-icon--cube text-white"></span>
<span class="anim-icon anim-icon--cube" style="color: #000"></span>
```

Para degradê, sobrescreva o fundo: `background: linear-gradient(...)`.
Para brilho que segue o contorno: `filter: drop-shadow(0 0 6px rgb(255 106 0 / 0.8))`.

O ícone tem uma cor só. Tons diferentes dentro do mesmo ícone só existem como opacidade
(veja "Criar um ícone").

### Classes e variáveis

| Nome | Função |
| --- | --- |
| `.anim-icon` | Classe base. Obrigatória. |
| `.anim-icon--<nome>` | Escolhe o ícone. |
| `.anim-icon-trigger` | No elemento pai: o hover ou foco dele dispara a animação. |
| `.is-playing` | Dispara a animação por código (adicione e remova a classe). |
| `.anim-icon--loop` | Repete enquanto estiver tocando, em vez de tocar uma vez. |
| `--anim-icon-size` | Largura do ícone. Padrão: `1.5em`. O ícone é sempre quadrado. |
| `--anim-icon-duration` | Duração. Padrão: a definida no ícone. |

O CSS gerado não trata `prefers-reduced-motion`: a decisão é de quem usa a biblioteca. Neste
projeto os ícones tocam mesmo com movimento reduzido (exceção declarada em `src/styles.css`),
porque a animação é curta, pequena e só começa com o hover. Para desligar nesse caso:

```css
@media (prefers-reduced-motion: reduce) {
  .anim-icon { animation: none !important; }
}
```

## Ícones disponíveis

| Classe | Animação |
| --- | --- |
| `anim-icon--cube` | Contorno se risca e as arestas internas saem do centro. |
| `anim-icon--arrow-right` | Seta sai pela direita e volta pela esquerda. |
| `anim-icon--arrow-up-right` | Seta sai pelo canto superior direito e volta pelo inferior esquerdo. |
| `anim-icon--chevron-right` | Chevron sai pela direita e volta pela esquerda. |

## Criar um ícone

1. Crie `tools/anim-icons/icons/<nome>.mjs`:

   ```js
   import { drawn, easeInOut, span } from '../helpers.mjs';

   export default {
     name: 'check',        // vira .anim-icon--check e check.webp
     viewBox: 32,          // lado do viewBox quadrado (padrão 32)
     frames: 20,           // quantidade de frames (padrão 20)
     duration: 600,        // duração em ms (padrão 700)
     // Atributos SVG aplicados a todos os frames
     attrs: 'fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"',
     // t vai de 0 a 1; devolve o conteúdo do <svg> naquele instante
     render(t) {
       return drawn([[6, 17], [13, 24], [26, 9]], easeInOut(span(t, 0, 1)));
     },
   };
   ```

2. Rode `npm run icons`.
3. Use `<span class="anim-icon anim-icon--check"></span>`.

O comando regenera todas as sprites e o `anim-icons.css` em `src/assets/anim-icons/`.
Esses arquivos são commitados; não edite o CSS à mão.

### Regras do `render(t)`

- **`t = 1` é o ícone completo.** O gerador usa `t = 1` no frame 0 (repouso) e no último
  frame, então a animação começa e termina no desenho final, sem salto ao sair do hover.
  Os frames intermediários recebem `t` de `1/(frames-1)` até `1`.
- **Desenhe em branco opaco.** `fill` e `stroke` já são brancos por padrão; não defina cores.
  Só o canal alfa importa.
- **Opacidade vira tom.** `opacity="0.5"` em um elemento deixa aquela parte a 50% da cor final.
- **Sem `pathLength`.** O renderizador não garante suporte; use `drawn()` para traços que se
  desenham, que calcula o comprimento real.

### Helpers (`helpers.mjs`)

| Função | O que faz |
| --- | --- |
| `drawn(pontos, progresso, { closed })` | Polilinha riscada até `progresso` (0 a 1). |
| `span(t, inicio, fim)` | Converte `t` em 0 a 1 dentro de uma janela, para escalonar partes. |
| `easeIn(t)`, `easeInOut(t)`, `easeOut(t)` | Curvas de suavização. |
| `translate(conteudo, dx, dy)` | Desloca um trecho de SVG; o que sai do viewBox é cortado. |
| `passThrough(t, distancia)` | Deslocamento de "sai por um lado, volta pelo outro", terminando em 0. |
| `clamp(v, min, max)` | Limita um valor. |
| `polylineLength(pontos, closed)` | Comprimento de uma polilinha. |

`drawn()` só aceita segmentos retos. Para curvas, aproxime com vários pontos ou anime por
outro meio (escala, rotação, opacidade) com `transform` no SVG do frame.

## Como funciona

- **Sprite**: `frames` quadros de 96 px lado a lado em um WebP sem perdas com transparência.
  96 px cobre ícones de até 48 px em telas 2x; para ícones maiores, aumente `FRAME_SIZE` em
  `generate.mjs`.
- **Máscara**: `.anim-icon` usa a sprite em `mask-image` com `mask-size` de
  `frames × 100%`, mostrando um quadro por vez, e pinta com `background-color: currentColor`.
- **Animação**: `mask-position` vai de `0%` a `100%` com `steps(frames, jump-none)`, que para
  exatamente em cada quadro, do primeiro ao último.
- **CSS gerado**: a classe base e uma classe por ícone, com URL relativa à pasta. A pasta
  `src/assets/anim-icons/` é autossuficiente.

## Estrutura

```
tools/anim-icons/
  generate.mjs      gerador (npm run icons)
  helpers.mjs       utilitários para descrever frames
  icons/<nome>.mjs  uma definição por ícone
  README.md         este arquivo
src/assets/anim-icons/
  anim-icons.css    gerado; importado em src/styles.css
  <nome>.webp       gerado; uma sprite por ícone
```

## Extrair como biblioteca

O gerador não depende do Angular nem do restante do projeto; só de `sharp` (dev) e Node 18+.
Para virar um pacote:

1. Mova `tools/anim-icons/` para o novo repositório.
2. Troque `outDir` em `generate.mjs` pela pasta de distribuição do pacote (por exemplo `dist/`).
3. Publique a pasta gerada: quem consome importa `anim-icons.css` e os `.webp` vão junto,
   referenciados por URL relativa.

Suporte de navegador: `mask` sem prefixo e `steps(..., jump-none)` exigem Chrome 77+,
Firefox 65+ e Safari 14+ (o CSS inclui `-webkit-mask` para versões intermediárias).
