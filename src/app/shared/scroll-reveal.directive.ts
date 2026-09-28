import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  host: {
    class: 'motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out',
    '(focusin)': 'reveal()',
  },
})
export class ScrollRevealDirective implements AfterViewInit {
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;

  constructor() {
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  ngAfterViewInit(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    if (this.element.nativeElement.getBoundingClientRect().top <= window.innerHeight * 0.92) {
      return;
    }

    this.renderer.addClass(this.element.nativeElement, 'scroll-reveal-pending');
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) this.reveal();
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    this.observer.observe(this.element.nativeElement);
  }

  protected reveal(): void {
    this.renderer.removeClass(this.element.nativeElement, 'scroll-reveal-pending');
    this.observer?.disconnect();
  }
}
