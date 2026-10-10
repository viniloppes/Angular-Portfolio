import { PortfolioCase } from './portfolio-case';
import { PortfolioCategory } from './portfolio-category';
import { isPlayableCase } from './playable-case';

export interface CategoryCount {
  name: string;
  count: number;
}

export interface CatalogSummary {
  caseCount: number;
  categoryCount: number;
  playableCount: number;
  videoCount: number;
  categories: CategoryCount[];
}

/**
 * Selos do catálogo derivados só dos cases ativos carregados do Supabase.
 * Categorias ativas sem case publicado aparecem com zero; nenhum número é estimado.
 */
export function summarizeCatalog(cases: readonly PortfolioCase[], categories: readonly PortfolioCategory[] = []): CatalogSummary {
  const counts = new Map<string, number>();
  for (const category of categories) counts.set(category.name, 0);
  for (const item of cases) {
    if (item.category) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return {
    caseCount: cases.length,
    categoryCount: counts.size,
    playableCount: cases.filter(isPlayableCase).length,
    videoCount: cases.filter((item) => Boolean(item.youtubeUrl)).length,
    categories: [...counts].map(([name, count]) => ({ name, count })),
  };
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
