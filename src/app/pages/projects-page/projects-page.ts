import { ButtonModule } from 'primeng/button';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCategoryService } from '../../core/portfolio-category.service';
import { PortfolioCategory } from '../../core/portfolio-category';
import { PortfolioCase } from '../../core/portfolio-case';

@Component({
  selector: 'app-projects-page',
  imports: [ButtonModule, CommonModule, CaseGallery],
  host: { class: 'block' },
  templateUrl: './projects-page.html',
})
export class ProjectsPage implements OnInit {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly categoryService = inject(PortfolioCategoryService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly activeCategory = signal('Todos');
  readonly activeCategories = signal<PortfolioCategory[]>([]);

  readonly categories = computed(() => [
    'Todos',
    ...this.activeCategories().map((category) => category.name),
  ]);
  readonly visibleCases = computed(() =>
    this.activeCategory() === 'Todos'
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
      if (!this.categories().includes(this.activeCategory())) this.activeCategory.set('Todos');
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
