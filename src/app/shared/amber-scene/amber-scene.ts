import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { AmberSceneHandle, AmberVariant } from './amber-renderer';

/**
 * Âmbar em 3D com imagem estática como poster.
 * O poster aparece já no SSR (LCP); o Three.js só é baixado no navegador, com WebGL,
 * tela >= 768px e sem prefers-reduced-motion. A cena só anima enquanto está visível.
 */
@Component({
  selector: 'app-amber-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block overflow-hidden',
    '(pointermove)': 'onPointer($event)',
  },
  template: `
    <img
      class="absolute inset-0 h-full w-full transition-opacity duration-700"
      [class.opacity-0]="ready()"
      [class.object-cover]="fit() === 'cover'"
      [class.object-contain]="fit() === 'contain'"
      [src]="poster()"
      alt=""
      [attr.fetchpriority]="priority() ? 'high' : null"
      [attr.loading]="priority() ? 'eager' : 'lazy'"
      width="1600"
      height="1600"
    />
    <canvas
      #canvas
      class="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
      [class.opacity-100]="ready()"
      aria-hidden="true"
    ></canvas>
  `,
})
export class AmberScene {
  readonly variant = input<AmberVariant>('stone');
  readonly poster = input.required<string>();
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly priority = input(false);

  readonly ready = signal(false);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private handle?: AmberSceneHandle;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let disposed = false;
    let visibility: IntersectionObserver | undefined;
    let sizing: ResizeObserver | undefined;

    afterNextRender(async () => {
      if (!this.canRender3d()) return;
      const { createAmberScene } = await import('./amber-renderer');
      if (disposed) return;

      try {
        this.handle = createAmberScene(this.canvas().nativeElement, this.variant(), () => this.ready.set(true));
      } catch {
        return; // Falha ao criar contexto WebGL: o poster continua.
      }

      const element = this.host.nativeElement;
      this.handle.resize(element.clientWidth, element.clientHeight);
      sizing = new ResizeObserver(([entry]) =>
        this.handle?.resize(entry.contentRect.width, entry.contentRect.height),
      );
      sizing.observe(element);
      visibility = new IntersectionObserver(([entry]) =>
        entry.isIntersecting ? this.handle?.start() : this.handle?.stop(),
      );
      visibility.observe(element);
      this.canvas().nativeElement.addEventListener('webglcontextlost', () => this.ready.set(false));
    });

    destroyRef.onDestroy(() => {
      disposed = true;
      visibility?.disconnect();
      sizing?.disconnect();
      this.handle?.dispose();
    });
  }

  onPointer(event: PointerEvent): void {
    if (!this.handle) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.handle.setPointer(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  }

  private canRender3d(): boolean {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (!window.matchMedia('(min-width: 768px)').matches) return false;
    const probe = document.createElement('canvas').getContext('webgl2');
    probe?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!probe;
  }
}
