import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { CaseProgressService } from '../../core/case-progress.service';
import { pluralize, summarizeCatalog } from '../../core/catalog-summary';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCategoryService } from '../../core/portfolio-category.service';
import { PortfolioCategory } from '../../core/portfolio-category';
import { PortfolioCase } from '../../core/portfolio-case';

const ALL = 'Todos';

@Component({
  selector: 'app-projects-page',
  imports: [CaseGallery],
  host: { class: 'block' },
  templateUrl: './projects-page.html',
})
export class ProjectsPage implements OnInit {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly categoryService = inject(PortfolioCategoryService);
  private readonly progress = inject(CaseProgressService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly pluralize = pluralize;

  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly activeCategory = signal(ALL);
  readonly activeCategories = signal<PortfolioCategory[]>([]);

  /** Resumo só existe com dados reais carregados; durante carregamento ou erro nenhum número é exibido. */
  readonly summary = computed(() =>
    this.loading() || this.errorMessage() ? null : summarizeCatalog(this.cases(), this.activeCategories()),
  );
  readonly collectedCount = computed(() => this.progress.countIn(this.cases().map((item) => item.id)));

  readonly categories = computed(() => {
    const stats = this.summary();
    return [
      { name: ALL, count: stats ? stats.caseCount : null },
      ...this.activeCategories().map((category) => ({
        name: category.name,
        count: stats ? (stats.categories.find((entry) => entry.name === category.name)?.count ?? 0) : null,
      })),
    ];
  });
  readonly visibleCases = computed(() =>
    this.activeCategory() === ALL
      ? this.cases()
      : this.cases().filter((item) => item.category === this.activeCategory()),
  );

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.loadCases();
  }

  async loadCases(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [cases, categories] = await Promise.all([
        this.portfolio.getPublicCases(),
        this.categoryService.getPublicCategories(),
      ]);
      this.cases.set(cases);
      this.activeCategories.set(categories);
      if (!this.categories().some((category) => category.name === this.activeCategory())) this.activeCategory.set(ALL);
    } catch {
      this.errorMessage.set('O catálogo não respondeu. Tente novamente em alguns instantes.');
    } finally {
      this.loading.set(false);
    }
  }

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }
}
