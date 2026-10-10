// Utilitários para descrever os frames de um ícone. Tudo trabalha em unidades do viewBox.

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Recorta o progresso global em uma janela: 0 antes de `start`, 1 depois de `end`. */
export const span = (t, start, end) => clamp((t - start) / (end - start));

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOut = (t) => 1 - (1 - t) ** 3;

export const easeIn = (t) => t * t;

/** Desloca um trecho de SVG. O que sair do viewBox é cortado pelo frame. */
export const translate = (content, dx, dy = 0) => `<g transform="translate(${dx.toFixed(3)} ${dy.toFixed(3)})">${content}</g>`;

/**
 * Sai por um lado e volta pelo oposto: devolve o deslocamento (em múltiplos de `distance`)
 * para `t` de 0 a 1, terminando em 0. Útil para setas que "avançam".
 */
export function passThrough(t, distance) {
  return t < 0.5 ? easeIn(t * 2) * distance : -easeIn(2 - t * 2) * distance;
}

export function polylineLength(points, closed = false) {
  const path = closed ? [...points, points[0]] : points;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  }
  return total;
}

/**
 * Polilinha desenhada até `progress` (0 a 1), como um traço sendo riscado.
 * O comprimento é calculado aqui porque o renderizador não garante suporte a `pathLength`.
 */
export function drawn(points, progress, { closed = false } = {}) {
  if (progress <= 0.001) return '';
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + (closed ? ' Z' : '');
  if (progress >= 0.999) return `<path d="${d}" />`;
  const length = polylineLength(points, closed);
  return `<path d="${d}" stroke-dasharray="${(length * progress).toFixed(3)} ${(length + 1).toFixed(3)}" />`;
}
