import { PortfolioCase } from './portfolio-case';

/** Jogo hospedado em uma página do próprio portfólio, fora do catálogo do admin. */
export interface LocalGame {
  id: string;
  name: string;
  description: string;
  category: string;
  /** Caminho em /assets ou URL absoluta da capa. */
  thumbnailUrl: string;
  /** Rota interna da página do jogo, por exemplo '/game'. */
  route: string;
}

/** Para publicar outro jogo próprio, crie a rota da página e acrescente um item aqui. */
export const LOCAL_GAMES: readonly LocalGame[] = [
  {
    id: 'local-snake',
    name: 'Snake de resina',
    description: 'Colete resinas, revele os projetos publicados e monte sua coleção nesta versão do clássico.',
    category: 'Game',
    thumbnailUrl: '/assets/games/snake.webp',
    route: '/game',
  },
];

/** Jogos locais no formato dos cases, para aparecerem nos mesmos cards da galeria. */
export function localGameCases(games: readonly LocalGame[] = LOCAL_GAMES): PortfolioCase[] {
  return games.map((game, index) => ({
    id: game.id,
    name: game.name,
    description: game.description,
    category: game.category,
    categoryId: '',
    thumbnailUrl: game.thumbnailUrl,
    routeUrl: game.route,
    sortOrder: index + 1,
    isActive: true,
  }));
}
