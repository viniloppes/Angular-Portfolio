export interface PortfolioCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface PortfolioCategoryInput {
  name: string;
  description: string;
}
