import { ButtonModule } from 'primeng/button';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCase } from '../../core/portfolio-case';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';
import { AmberScene } from '../../shared/amber-scene/amber-scene';

@Component({
  selector: 'app-home-page',
  imports: [ButtonModule, CommonModule, RouterLink, CaseGallery, ScrollRevealDirective, AmberScene],
  host: { class: 'block' },
  templateUrl: './home-page.html',
})
export class HomePage implements OnInit {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly areas = ['Web', 'Jogos', 'Interação'];
  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

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
