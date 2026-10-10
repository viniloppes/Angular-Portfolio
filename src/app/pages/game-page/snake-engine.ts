export type Direction = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'ready' | 'running' | 'paused' | 'over';

export interface Point {
  x: number;
  y: number;
}

export interface StepResult {
  ate: boolean;
  died: boolean;
}

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** Regras do Snake sem DOM: o componente só desenha o estado e chama step() no ritmo do jogo. */
export class SnakeEngine {
  snake: Point[] = [];
  fruit: Point = { x: 0, y: 0 };
  direction: Direction = 'right';
  status: SnakeStatus = 'ready';
  fruitsEaten = 0;
  private queue: Direction[] = [];

  constructor(
    readonly cols: number,
    readonly rows: number,
    private readonly random: () => number = Math.random,
  ) {
    this.reset();
  }

  reset(): void {
    const y = Math.floor(this.rows / 2);
    const x = Math.floor(this.cols / 3);
    this.snake = [
      { x, y },
      { x: x - 1, y },
      { x: x - 2, y },
    ];
    this.direction = 'right';
    this.queue = [];
    this.fruitsEaten = 0;
    this.status = 'ready';
    this.placeFruit();
  }

  /** Enfileira até duas viradas por tick, para curvas rápidas não se perderem nem virarem ré. */
  turn(next: Direction): void {
    if (this.status === 'over') return;
    const last = this.queue.at(-1) ?? this.direction;
    if (next === last || next === OPPOSITE[last] || this.queue.length >= 2) return;
    this.queue.push(next);
  }

  step(): StepResult {
    if (this.status !== 'running') return { ate: false, died: false };

    this.direction = this.queue.shift() ?? this.direction;
    const vector = VECTORS[this.direction];
    const head = { x: this.snake[0].x + vector.x, y: this.snake[0].y + vector.y };
    const ate = head.x === this.fruit.x && head.y === this.fruit.y;
    // Sem fruta, a cauda anda junto: a cabeça pode ocupar a célula que a cauda acabou de liberar.
    const body = ate ? this.snake : this.snake.slice(0, -1);

    const outside = head.x < 0 || head.y < 0 || head.x >= this.cols || head.y >= this.rows;
    if (outside || body.some((part) => part.x === head.x && part.y === head.y)) {
      this.status = 'over';
      return { ate: false, died: true };
    }

    this.snake = [head, ...body];
    if (ate) {
      this.fruitsEaten++;
      if (!this.placeFruit()) this.status = 'over';
    }
    return { ate, died: false };
  }

  private placeFruit(): boolean {
    const free: Point[] = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.snake.some((part) => part.x === x && part.y === y)) free.push({ x, y });
      }
    }
    if (free.length === 0) return false;
    this.fruit = free[Math.min(free.length - 1, Math.floor(this.random() * free.length))];
    return true;
  }
}
