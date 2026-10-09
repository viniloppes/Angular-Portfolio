import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { isPlayableCase } from '../../core/playable-case';
import { PortfolioCase } from '../../core/portfolio-case';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { pluralize } from '../../core/catalog-summary';

@Component({
  selector: 'app-games-page',
  imports: [RouterLink, CaseGallery],
  host: { class: 'block' },
  templateUrl: './games-page.html',
  styleUrl: './games-page.css',
})
export class GamesPage implements OnInit {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly playableCases = computed(() => this.cases().filter(isPlayableCase));
  readonly playableCount = computed(() => this.playableCases().length);
  readonly playableSummary = computed(() => pluralize(this.playableCount(), 'jogo jogável', 'jogos jogáveis'));

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.loadCases();
  }

  async loadCases(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.cases.set(await this.portfolio.getPublicCases());
    } catch {
      this.errorMessage.set('O catálogo não respondeu. Tente novamente em alguns instantes.');
    } finally {
      this.loading.set(false);
    }
  }
}
