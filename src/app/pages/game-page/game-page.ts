import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaseProgressService } from '../../core/case-progress.service';
import { PortfolioCase } from '../../core/portfolio-case';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { Direction, SnakeEngine, SnakeStatus } from './snake-engine';

type GalleryState = 'loading' | 'ready' | 'empty' | 'error';

const GRID = 18;
const SWIPE_THRESHOLD = 24;
const BEST_KEY = 'amberlink.arcade.snake-best.v1';
const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

@Component({
  selector: 'app-game-page',
  imports: [RouterLink],
  host: {
    class: 'block',
    '(document:keydown)': 'onKeydown($event)',
    '(document:visibilitychange)': 'pauseIfHidden()',
    '(window:blur)': 'pause()',
  },
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly progress = inject(CaseProgressService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('board');

  private readonly engine = new SnakeEngine(GRID, GRID);
  private reducedMotion = false;
  private frame = 0;
  private lastTime = 0;
  private elapsed = 0;
  private swipeOrigin: { x: number; y: number; id: number } | null = null;
  private readonly fruitImages = new Map<string, HTMLImageElement>();

  readonly cases = signal<PortfolioCase[]>([]);
  readonly galleryState = signal<GalleryState>('loading');
  readonly status = signal<SnakeStatus>('ready');
  readonly score = signal(0);
  readonly best = signal(0);
  /** Último case revelado: fica na galeria até a próxima resina, inclusive entre partidas. */
  readonly revealed = signal<{ item: PortfolioCase; index: number; isNew: boolean } | null>(null);
  readonly announcement = signal('');

  readonly nextCase = computed(() => {
    const list = this.cases();
    return list.length ? list[this.score() % list.length] : null;
  });
  readonly collectedCount = computed(() => this.progress.countIn(this.cases().map((item) => item.id)));
  readonly collectedIds = this.progress.collectedIds;

  constructor() {
    if (!this.isBrowser) return;
    const destroyRef = inject(DestroyRef);

    this.best.set(this.readBest());
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    void this.loadCases();

    afterNextRender(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) return;
      if (typeof ResizeObserver === 'undefined') return this.resize(canvas);
      const observer = new ResizeObserver(() => this.resize(canvas));
      observer.observe(canvas);
      this.resize(canvas);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    destroyRef.onDestroy(() => cancelAnimationFrame(this.frame));
  }

  async loadCases(): Promise<void> {
    this.galleryState.set('loading');
    try {
      const list = await this.portfolio.getPublicCases();
      this.cases.set(list);
      this.galleryState.set(list.length ? 'ready' : 'empty');
      if (list.length) this.preloadFruit(list[this.score() % list.length]);
    } catch {
      // Sem catálogo o jogo continua: as frutas viram resina âmbar e a galeria mostra o erro.
      this.cases.set([]);
      this.galleryState.set('error');
    }
    this.draw();
  }

  imageUrl(path: string): string {
    return this.portfolio.imageUrl(path);
  }

  start(): void {
    if (this.engine.status === 'over') this.restart();
    if (this.engine.status === 'running') return;
    this.engine.status = 'running';
    this.syncStatus('Jogo em andamento.');
    this.lastTime = performance.now();
    this.elapsed = 0;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame((time) => this.loop(time));
  }

  pause(): void {
    if (this.engine.status !== 'running') return;
    this.engine.status = 'paused';
    cancelAnimationFrame(this.frame);
    this.syncStatus('Jogo pausado.');
    this.draw();
  }

  togglePause(): void {
    if (this.engine.status === 'running') this.pause();
    else this.start();
  }

  restart(): void {
    cancelAnimationFrame(this.frame);
    this.engine.reset();
    this.score.set(0);
    this.syncStatus('Nova partida. Use as setas, WASD ou deslize para começar.');
    const first = this.cases()[0];
    if (first) this.preloadFruit(first);
    this.draw();
  }

  pauseIfHidden(): void {
    if (document.hidden) this.pause();
  }

  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
    const onControl = Boolean(target?.closest('button, a'));
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    const direction = KEY_DIRECTIONS[key];
    if (direction) {
      event.preventDefault();
      this.steer(direction);
      return;
    }
    if ((key === ' ' || key === 'p') && !onControl) {
      event.preventDefault();
      this.togglePause();
    } else if (key === 'r' && !event.ctrlKey && !event.metaKey) {
      this.restart();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') return;
    this.swipeOrigin = { x: event.clientX, y: event.clientY, id: event.pointerId };
    try {
      // Mantém o gesto no tabuleiro mesmo se o dedo sair dele; pode falhar se o ponteiro já foi solto.
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Sem captura o gesto ainda funciona enquanto o dedo estiver sobre o tabuleiro.
    }
  }

  /** Lê o gesto enquanto o dedo ainda se move, para curvas em sequência sem precisar soltar a tela. */
  onPointerMove(event: PointerEvent): void {
    const origin = this.swipeOrigin;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    this.steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    this.swipeOrigin = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  onPointerUp(event: PointerEvent): void {
    const origin = this.swipeOrigin;
    this.swipeOrigin = null;
    if (!origin || origin.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    // Toque simples no tabuleiro começa ou retoma a partida.
    if (moved < SWIPE_THRESHOLD / 2 && this.engine.status !== 'running') this.start();
  }

  isCollected(item: PortfolioCase): boolean {
    return this.collectedIds().has(item.id);
  }

  clearProgress(): void {
    this.progress.clear();
    this.announcement.set('Progresso da coleção apagado neste navegador.');
  }

  /** step() muda o status por dentro; ler por getter evita o estreitamento de tipo do TypeScript. */
  private get isRunning(): boolean {
    return this.engine.status === 'running';
  }

  private steer(direction: Direction): void {
    this.engine.turn(direction);
    if (this.engine.status !== 'running') this.start();
  }

  private loop(time: number): void {
    if (this.engine.status !== 'running') return;
    const tick = this.reducedMotion ? 190 : Math.max(80, 130 - this.engine.fruitsEaten * 2);
    this.elapsed += Math.min(250, time - this.lastTime);
    this.lastTime = time;

    while (this.elapsed >= tick && this.isRunning) {
      this.elapsed -= tick;
      const result = this.engine.step();
      if (result.ate) this.collectFruit();
      if (!this.isRunning) this.finish();
    }

    this.draw(time);
    if (this.isRunning) this.frame = requestAnimationFrame((next) => this.loop(next));
  }

  /** A fruta n revela o case n (ordem de exibição), sem interromper o loop do jogo. */
  private collectFruit(): void {
    const eaten = this.engine.fruitsEaten;
    this.score.set(eaten);
    const list = this.cases();
    if (!list.length) return;

    const index = (eaten - 1) % list.length;
    const item = list[index];
    const isNew = !this.progress.has(item.id);
    this.progress.collect(item.id);
    this.revealed.set({ item, index, isNew });
    this.announcement.set(`Case revelado: ${item.name}.`);
    this.preloadFruit(list[eaten % list.length]);
  }

  private finish(): void {
    const score = this.engine.fruitsEaten;
    if (score > this.best()) {
      this.best.set(score);
      this.writeBest(score);
    }
    this.syncStatus(`Fim de jogo. ${score === 1 ? '1 resina coletada' : `${score} resinas coletadas`}.`);
  }

  private syncStatus(message: string): void {
    this.status.set(this.engine.status);
    this.announcement.set(message);
  }

  private preloadFruit(item: PortfolioCase): void {
    if (this.fruitImages.has(item.id)) return;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => this.draw();
    image.src = this.imageUrl(item.thumbnailUrl);
    this.fruitImages.set(item.id, image);
  }

  private resize(canvas: HTMLCanvasElement): void {
    const size = canvas.getBoundingClientRect().width;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixels = Math.max(1, Math.round(size * ratio));
    if (canvas.width !== pixels) {
      canvas.width = pixels;
      canvas.height = pixels;
    }
    this.draw();
  }

  private draw(time = performance.now()): void {
    const canvas = this.canvasRef()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const cell = canvas.width / GRID;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chão de musgo em xadrez discreto.
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#141b12' : '#11170f';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    this.drawFruit(ctx, cell, time);

    const length = this.engine.snake.length;
    this.engine.snake.forEach((part, index) => {
      const t = length > 1 ? index / (length - 1) : 0;
      const inset = cell * (index === 0 ? 0.06 : 0.12);
      ctx.fillStyle = index === 0 ? '#ffd199' : mix('#ff9f33', '#a85200', t);
      roundRect(ctx, part.x * cell + inset, part.y * cell + inset, cell - inset * 2, cell - inset * 2, cell * 0.28);
      ctx.fill();
    });

    const head = this.engine.snake[0];
    if (head) {
      ctx.fillStyle = '#1f1712';
      const eye = cell * 0.11;
      const [ax, ay, bx, by] = eyeOffsets(this.engine.direction);
      ctx.beginPath();
      ctx.arc((head.x + ax) * cell, (head.y + ay) * cell, eye, 0, Math.PI * 2);
      ctx.arc((head.x + bx) * cell, (head.y + by) * cell, eye, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFruit(ctx: CanvasRenderingContext2D, cell: number, time: number): void {
    const { x, y } = this.engine.fruit;
    const cx = (x + 0.5) * cell;
    const cy = (y + 0.5) * cell;
    const pulse = this.reducedMotion || this.engine.status !== 'running' ? 0 : Math.sin(time / 260) * 0.04;
    const radius = cell * (0.42 + pulse);

    const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.9);
    glow.addColorStop(0, 'rgb(255 159 51 / 0.45)');
    glow.addColorStop(1, 'rgb(255 159 51 / 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - radius * 2, cy - radius * 2, radius * 4, radius * 4);

    const next = this.nextCase();
    const image = next ? this.fruitImages.get(next.id) : undefined;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    if (image?.complete && image.naturalWidth > 0) {
      // Capa do próximo case "presa" na resina: imagem real com véu âmbar por cima.
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2,
      );
      ctx.fillStyle = 'rgb(245 138 7 / 0.35)';
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    } else {
      const resin = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
      resin.addColorStop(0, '#ffe8cc');
      resin.addColorStop(0.35, '#ff9f33');
      resin.addColorStop(1, '#a85200');
      ctx.fillStyle = resin;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.restore();

    ctx.strokeStyle = '#ffd199';
    ctx.lineWidth = Math.max(1, cell * 0.07);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  private readBest(): number {
    try {
      const value = Number(localStorage.getItem(BEST_KEY));
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  }

  private writeBest(value: number): void {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Storage indisponível: o recorde vale só para esta visita.
    }
  }
}

function eyeOffsets(direction: Direction): [number, number, number, number] {
  switch (direction) {
    case 'up':
      return [0.32, 0.3, 0.68, 0.3];
    case 'down':
      return [0.32, 0.7, 0.68, 0.7];
    case 'left':
      return [0.3, 0.32, 0.3, 0.68];
    default:
      return [0.7, 0.32, 0.7, 0.68];
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function mix(from: string, to: string, t: number): string {
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const channel = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}
