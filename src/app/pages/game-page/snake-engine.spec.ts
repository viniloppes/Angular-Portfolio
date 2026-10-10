import { SnakeEngine } from './snake-engine';

describe('SnakeEngine', () => {
  it('starts ready and only moves after running', () => {
    const game = new SnakeEngine(10, 10, () => 0);
    const head = { ...game.snake[0] };

    expect(game.status).toBe('ready');
    expect(game.step()).toEqual({ ate: false, died: false });
    expect(game.snake[0]).toEqual(head);

    game.status = 'running';
    game.step();
    expect(game.snake[0]).toEqual({ x: head.x + 1, y: head.y });
  });

  it('ignores reversing into itself and queues at most two turns', () => {
    const game = new SnakeEngine(10, 10, () => 0);
    game.status = 'running';

    game.turn('left');
    game.step();
    expect(game.direction).toBe('right');

    game.turn('up');
    game.turn('left');
    game.turn('down');
    game.step();
    expect(game.direction).toBe('up');
    game.step();
    expect(game.direction).toBe('left');
  });

  it('grows and counts fruit when the head reaches it', () => {
    const game = new SnakeEngine(10, 10, () => 0);
    game.status = 'running';
    const head = game.snake[0];
    game.fruit = { x: head.x + 1, y: head.y };

    const result = game.step();

    expect(result.ate).toBe(true);
    expect(game.fruitsEaten).toBe(1);
    expect(game.snake.length).toBe(4);
    expect(game.snake.some((p) => p.x === game.fruit.x && p.y === game.fruit.y)).toBe(false);
  });

  it('ends the run on wall collision', () => {
    const game = new SnakeEngine(5, 5, () => 0);
    game.status = 'running';
    game.fruit = { x: 0, y: 0 };

    let died = false;
    for (let i = 0; i < 5 && !died; i++) died = game.step().died;

    expect(died).toBe(true);
    expect(game.status).toBe('over');
  });

  it('reset restores a fresh ready run', () => {
    const game = new SnakeEngine(10, 10, () => 0);
    game.status = 'over';
    game.fruitsEaten = 4;

    game.reset();

    expect(game.status).toBe('ready');
    expect(game.fruitsEaten).toBe(0);
    expect(game.snake.length).toBe(3);
  });
});
