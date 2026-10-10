import { passThrough, translate } from '../helpers.mjs';

const chevron = '<path d="M12 6 22 16 12 26" />';

// Chevron que avança: sai pela direita e volta pela esquerda.
export default {
  name: 'chevron-right',
  viewBox: 32,
  frames: 20,
  duration: 480,
  attrs: 'fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"',
  render(t) {
    return translate(chevron, passThrough(t, 26));
  },
};
