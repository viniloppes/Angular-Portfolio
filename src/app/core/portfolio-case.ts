export interface PortfolioCase {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  youtubeUrl?: string | null;
  gameUrl?: string | null;
  projectUrl?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioCaseInput {
  name: string;
  description: string;
  category: string;
  youtubeUrl: string;
  gameUrl: string;
  projectUrl: string;
  sortOrder: number;
}
