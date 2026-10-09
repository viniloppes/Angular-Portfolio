import { PortfolioCase } from './portfolio-case';
import { PortfolioCategory } from './portfolio-category';
import { pluralize, summarizeCatalog } from './catalog-summary';

const item = (id: string, category: string, extra: Partial<PortfolioCase> = {}): PortfolioCase => ({
  id,
  name: id,
  description: '',
  category,
  categoryId: category,
  thumbnailUrl: '',
  sortOrder: 0,
  isActive: true,
  ...extra,
});

const category = (name: string): PortfolioCategory => ({
  id: name,
  name,
  description: '',
  createdAt: '',
  updatedAt: '',
  isActive: true,
});

describe('summarizeCatalog', () => {
  it('counts only the cases it receives', () => {
    const summary = summarizeCatalog(
      [item('a', 'Jogos', { gameUrl: 'https://x' }), item('b', 'Web', { youtubeUrl: 'https://y' }), item('c', 'Jogos')],
      [category('Jogos'), category('Web'), category('Interação')],
    );

    expect(summary.caseCount).toBe(3);
    expect(summary.categoryCount).toBe(3);
    expect(summary.playableCount).toBe(1);
    expect(summary.videoCount).toBe(1);
    expect(summary.categories).toEqual([
      { name: 'Jogos', count: 2 },
      { name: 'Web', count: 1 },
      { name: 'Interação', count: 0 },
    ]);
  });

  it('returns zeros for an empty catalog', () => {
    expect(summarizeCatalog([])).toEqual({ caseCount: 0, categoryCount: 0, playableCount: 0, videoCount: 0, categories: [] });
  });

  it('pluralizes Portuguese labels', () => {
    expect(pluralize(1, 'case', 'cases')).toBe('1 case');
    expect(pluralize(2, 'case', 'cases')).toBe('2 cases');
  });
});
