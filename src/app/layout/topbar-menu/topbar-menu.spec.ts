import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TopbarMenu } from './topbar-menu';

@Component({ template: '' })
class BlankPage {}

describe('TopbarMenu', () => {
  let component: TopbarMenu;
  let fixture: ComponentFixture<TopbarMenu>;

  const toggle = (): HTMLButtonElement => fixture.nativeElement.querySelector('.topbar-toggle');
  const drawerLinks = (): HTMLAnchorElement[] => Array.from(document.querySelectorAll('.topbar-drawer a'));

  const openDrawer = async () => {
    toggle().click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarMenu],
      providers: [provideRouter([{ path: '**', component: BlankPage }])],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the menu button collapsed', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().getAttribute('aria-label')).toBe('Abrir menu');
    expect(drawerLinks().length).toBe(0);
  });

  it('opens the drawer with every navigation link', async () => {
    await openDrawer();

    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(drawerLinks().map((link) => link.textContent?.trim())).toEqual(['Projetos', 'Artigos', 'Jogos', 'Contato']);
    expect(drawerLinks().map((link) => link.getAttribute('href'))).toEqual([
      '/projects',
      '/articles',
      '/games',
      '/contact',
    ]);
  });

  it('closes the drawer when a link is chosen', async () => {
    await openDrawer();

    drawerLinks()[0].click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });
});
