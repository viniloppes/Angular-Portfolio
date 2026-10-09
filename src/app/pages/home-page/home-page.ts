import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaseGallery } from '../../components/case-gallery/case-gallery';
import { pluralize } from '../../core/catalog-summary';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCase } from '../../core/portfolio-case';
import { isPlayableCase } from '../../core/playable-case';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';
import { HomeStory } from './home-story';

type RouteId = 'projects' | 'about' | 'articles' | 'contact' | 'game';

interface LobbyRoute {
  id: RouteId;
  label: string;
  link: string;
  fragment?: string;
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CaseGallery, ScrollRevealDirective, HomeStory],
  host: { class: 'block' },
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  private readonly portfolio = inject(PortfolioDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly areas = ['Web', 'Jogos', 'Interação'];
  readonly routes: LobbyRoute[] = [
    { id: 'projects', label: 'Projetos', link: '/projects' },
    { id: 'about', label: 'Sobre', link: '/home', fragment: 'sobre' },
    { id: 'articles', label: 'Artigos', link: '/articles' },
    { id: 'contact', label: 'Contato', link: '/contact' },
    { id: 'game', label: 'Jogos', link: '/games' },
  ];
  readonly cases = signal<PortfolioCase[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  /** Selos só aparecem com o catálogo carregado: nada de contagem durante o carregamento ou após erro. */
  private readonly catalogReady = computed(() => !this.loading() && !this.errorMessage());
  private readonly projectsBadge = computed(() =>
    this.catalogReady() ? pluralize(this.cases().length, 'case', 'cases') : null,
  );
  private readonly gameBadge = computed(() => {
    const total = this.cases().filter(isPlayableCase).length;
    if (!this.catalogReady() || total === 0) return null;
    return `${total} ${total === 1 ? 'jogável' : 'jogáveis'}`;
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.loadCases();
  }

  badgeFor(id: RouteId): string | null {
    if (id === 'projects') return this.projectsBadge();
    if (id === 'game') return this.gameBadge();
    return null;
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
