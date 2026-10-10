import { passThrough, translate } from '../helpers.mjs';

const arrow = '<path d="M5 16H27" /><path d="M18 7 27 16 18 25" />';

// Seta que avança: sai pela direita e volta pela esquerda.
export default {
  name: 'arrow-right',
  viewBox: 32,
  frames: 20,
  duration: 520,
  attrs: 'fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"',
  render(t) {
    return translate(arrow, passThrough(t, 30));
  },
};
