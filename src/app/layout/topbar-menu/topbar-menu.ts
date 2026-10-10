import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideX } from '@ng-icons/lucide';

import { ZardSheetImports } from '@/shared/components/sheet/sheet.imports';

interface TopbarLink {
  path: string;
  label: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-topbar-menu',
  imports: [RouterLink, RouterLinkActive, NgIcon, ZardSheetImports],
  viewProviders: [provideIcons({ lucideMenu, lucideX })],
  host: { class: 'block' },
  templateUrl: './topbar-menu.html',
})
export class TopbarMenu {
  protected readonly links: TopbarLink[] = [
    { path: '/projects', label: 'Projetos' },
    { path: '/articles', label: 'Artigos' },
    { path: '/games', label: 'Jogos', highlight: true },
    { path: '/contact', label: 'Contato' },
  ];

  protected readonly menuOpen = signal(false);
}
