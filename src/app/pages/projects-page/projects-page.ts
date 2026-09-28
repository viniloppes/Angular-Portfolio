import { ButtonModule } from 'primeng/button';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { PortfolioApiService } from '../../core/portfolio-api.service';
import { PortfolioCase } from '../../core/portfolio-case';

@Component({
  selector: 'app-projects-page',
  imports: [ButtonModule, CommonModule, CaseGallery],
  host: { class: 'block' },
  templateUrl: './projects-page.html',
})
export class ProjectsPage implements OnInit {
  private readonly api = inject(PortfolioApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly activeCategory = signal('Todos');

  readonly categories = computed(() => [
    'Todos',
    ...new Set(
      this.cases()
        .map((item) => item.category)
        .filter(Boolean),
    ),
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
      this.cases.set(await this.api.getPublicCases());
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
