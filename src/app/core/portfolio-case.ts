export interface PortfolioCase {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  thumbnailUrl: string;
  youtubeUrl?: string | null;
  gameUrl?: string | null;
  projectUrl?: string | null;
  /** Rota interna de um jogo local (ver local-games.ts); o card navega em vez de abrir o diálogo. */
  routeUrl?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface PortfolioCaseInput {
  name: string;
  description: string;
  categoryId: string;
  youtubeUrl: string;
  gameUrl: string;
  projectUrl: string;
  sortOrder: number;
}
