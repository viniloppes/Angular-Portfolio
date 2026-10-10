import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { localGameCases } from '../../core/local-games';
import { isPlayableCase } from '../../core/playable-case';
import { PortfolioCase } from '../../core/portfolio-case';
import { PortfolioDataService } from '../../core/portfolio-data.service';

@Component({
  selector: 'app-games-page',
  imports: [CaseGallery],
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
  /** Jogos locais primeiro; os cases jogáveis do catálogo vêm em seguida, nos mesmos cards. */
  readonly playableCases = computed(() => [...localGameCases(), ...this.cases().filter(isPlayableCase)]);

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
