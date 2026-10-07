import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCase } from '../../core/portfolio-case';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

type MediaMode = 'image' | 'video' | 'game';

@Component({
  selector: 'app-case-gallery',
  imports: [CommonModule, ButtonModule, SkeletonModule, ScrollRevealDirective],
  templateUrl: './case-gallery.html',
  styleUrl: './case-gallery.css',
})
export class CaseGallery {
  @Input() cases: PortfolioCase[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() limit?: number;
  @Output() retry = new EventEmitter<void>();
  @ViewChild('caseDialog') private caseDialog?: ElementRef<HTMLDialogElement>;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly portfolio = inject(PortfolioDataService);

  selectedCase: PortfolioCase | null = null;
  mediaMode: MediaMode = 'image';
  videoUrl: SafeResourceUrl | null = null;
  gameUrl: SafeResourceUrl | null = null;

  get visibleCases(): PortfolioCase[] {
    return this.limit ? this.cases.slice(0, this.limit) : this.cases;
  }

  openCase(item: PortfolioCase): void {
    this.selectedCase = item;
    this.videoUrl = this.toYouTubeEmbed(item.youtubeUrl);
    this.gameUrl = this.toSafeHttpsUrl(item.gameUrl);
    this.mediaMode = this.videoUrl ? 'video' : this.gameUrl ? 'game' : 'image';

    queueMicrotask(() => {
      if (this.caseDialog && !this.caseDialog.nativeElement.open) {
        this.caseDialog.nativeElement.showModal();
      }
    });
  }

  closeCase(): void {
    this.caseDialog?.nativeElement.close();
  }

  handleDialogClick(event: MouseEvent): void {
    if (event.target === this.caseDialog?.nativeElement) this.closeCase();
  }

  clearSelection(): void {
    this.selectedCase = null;
    this.videoUrl = null;
    this.gameUrl = null;
  }

  imageUrl(path: string): string {
    return this.portfolio.imageUrl(path);
  }

  setMediaMode(mode: MediaMode): void {
    this.mediaMode = mode;
  }

  private toYouTubeEmbed(value?: string | null): SafeResourceUrl | null {
    if (!value) return null;

    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();
      let id = '';

      if (host === 'youtu.be') {
        id = url.pathname.split('/').filter(Boolean)[0] ?? '';
      } else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
        if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
        else if (/^\/(embed|shorts)\/[^/]+/.test(url.pathname))
          id = url.pathname.split('/')[2] ?? '';
      }

      if (!/^[\w-]{11}$/.test(id)) return null;
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        'https://www.youtube-nocookie.com/embed/' + id,
      );
    } catch {
      return null;
    }
  }

  private toSafeHttpsUrl(value?: string | null): SafeResourceUrl | null {
    if (!value) return null;

    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return null;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url.toString());
    } catch {
      return null;
    }
  }
}
