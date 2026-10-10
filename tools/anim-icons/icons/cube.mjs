import { drawn, easeInOut, easeOut, span } from '../helpers.mjs';

const outline = [
  [16, 3],
  [28, 9.5],
  [28, 22.5],
  [16, 29],
  [4, 22.5],
  [4, 9.5],
];
const center = [16, 16];
const edges = [
  [center, [4, 9.5]],
  [center, [28, 9.5]],
  [center, [16, 29]],
];

// Cubo que se redesenha: contorno riscado em volta e, depois, as arestas internas saindo do centro.
export default {
  name: 'cube',
  viewBox: 32,
  frames: 20,
  duration: 700,
  attrs: 'fill="none" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"',
  render(t) {
    const hull = drawn(outline, easeInOut(span(t, 0, 0.7)), { closed: true });
    const inner = edges.map((edge) => drawn(edge, easeOut(span(t, 0.45, 1)))).join('');
    return hull + inner;
  },
};
