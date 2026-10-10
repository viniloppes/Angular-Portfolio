import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { GamePage } from './game-page';

describe('GamePage', () => {
  let fixture: ComponentFixture<GamePage>;

  async function setup(getPublicCases: () => Promise<unknown>) {
    await TestBed.configureTestingModule({
      imports: [GamePage],
      providers: [
        provideRouter([]),
        { provide: PortfolioDataService, useValue: { getPublicCases, imageUrl: (path: string) => path } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GamePage);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('keeps the game playable and shows a gallery error when cases fail to load', async () => {
    await setup(() => Promise.reject(new Error('offline')));

    const text = fixture.nativeElement.textContent as string;
    expect(fixture.componentInstance.galleryState()).toBe('error');
    expect(text).toContain('Não foi possível carregar a galeria de cases.');
    expect(text).not.toContain('cases coletados');
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });

  it('shows collection progress only from loaded case ids', async () => {
    await setup(() =>
      Promise.resolve([
        { id: 'a', name: 'A', description: '', category: 'Web', categoryId: 'w', thumbnailUrl: 'a.png', sortOrder: 1, isActive: true },
        { id: 'b', name: 'B', description: '', category: 'Jogos', categoryId: 'j', thumbnailUrl: 'b.png', sortOrder: 2, isActive: true },
      ]),
    );

    expect(fixture.componentInstance.galleryState()).toBe('ready');
    expect(fixture.componentInstance.nextCase()?.id).toBe('a');
    expect(fixture.nativeElement.textContent).toContain('/2 cases coletados');
  });
});
