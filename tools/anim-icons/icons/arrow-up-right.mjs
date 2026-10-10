import { passThrough, translate } from '../helpers.mjs';

const arrow = '<path d="M8 24 24 8" /><path d="M11 8H24V21" />';

// Seta de link externo: sai pelo canto superior direito e volta pelo inferior esquerdo.
export default {
  name: 'arrow-up-right',
  viewBox: 32,
  frames: 20,
  duration: 520,
  attrs: 'fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"',
  render(t) {
    const offset = passThrough(t, 28);
    return translate(arrow, offset, -offset);
  },
};
