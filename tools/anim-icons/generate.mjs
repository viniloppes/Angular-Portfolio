// Gera as sprites WebP e o CSS dos ícones animados. Uso: npm run icons
// Documentação: tools/anim-icons/README.md
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, 'icons');
const outDir = resolve(here, '../../src/assets/anim-icons');

// Lado de cada frame em pixels. 96 cobre ícones de até 48px em telas 2x.
const FRAME_SIZE = 96;

const BASE_CSS = `/* GERADO por tools/anim-icons/generate.mjs. Não edite: rode \`npm run icons\`. */
.anim-icon {
  --anim-icon-frames: 20;
  --anim-icon-duration: 700ms;
  aspect-ratio: 1;
  background-color: currentColor;
  display: inline-block;
  flex: none;
  -webkit-mask: var(--anim-icon-src) 0 0 / calc(var(--anim-icon-frames) * 100%) 100% no-repeat;
  mask: var(--anim-icon-src) 0 0 / calc(var(--anim-icon-frames) * 100%) 100% no-repeat;
  vertical-align: middle;
  width: var(--anim-icon-size, 1.5em);
}

.anim-icon:hover,
.anim-icon.is-playing,
.anim-icon-trigger:hover .anim-icon,
.anim-icon-trigger:focus-visible .anim-icon {
  animation: anim-icon-play var(--anim-icon-duration) steps(var(--anim-icon-frames), jump-none) forwards;
}

.anim-icon--loop {
  animation-iteration-count: infinite !important;
}

@keyframes anim-icon-play {
  to {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }
}
`;

function frameSvg(icon, t) {
  const box = icon.viewBox ?? 32;
  // Branco opaco: a cor final vem do CSS, a sprite só fornece o canal alfa.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="${FRAME_SIZE}" height="${FRAME_SIZE}" fill="#fff" stroke="#fff"><g ${icon.attrs ?? ''}>${icon.render(t)}</g></svg>`;
}

async function buildSprite(icon) {
  const frames = icon.frames ?? 20;
  if (frames < 2) throw new Error(`${icon.name}: são necessários pelo menos 2 frames.`);

  const composites = [];
  for (let index = 0; index < frames; index++) {
    // O frame 0 é o ícone em repouso; ele e o último mostram o desenho completo (t = 1).
    const t = index === 0 ? 1 : index / (frames - 1);
    const input = await sharp(Buffer.from(frameSvg(icon, t))).png().toBuffer();
    composites.push({ input, left: index * FRAME_SIZE, top: 0 });
  }

  const file = join(outDir, `${icon.name}.webp`);
  await sharp({
    create: { width: frames * FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .webp({ lossless: true, effort: 6 })
    .toFile(file);

  return { frames, bytes: (await stat(file)).size };
}

const files = (await readdir(iconsDir)).filter((name) => name.endsWith('.mjs')).sort();
await mkdir(outDir, { recursive: true });

let css = BASE_CSS;
for (const name of files) {
  const { default: icon } = await import(pathToFileURL(join(iconsDir, name)).href);
  const { frames, bytes } = await buildSprite(icon);
  css += `
.anim-icon--${icon.name} {
  --anim-icon-src: url('./${icon.name}.webp');
  --anim-icon-frames: ${frames};
  --anim-icon-duration: ${icon.duration ?? 700}ms;
}
`;
  console.log(`${icon.name}.webp  ${frames} frames  ${(bytes / 1024).toFixed(1)} kB`);
}

await writeFile(join(outDir, 'anim-icons.css'), css);
console.log(`anim-icons.css  ${files.length} ícone(s)`);
