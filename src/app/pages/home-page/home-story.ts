import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../shared/scroll-reveal.directive';

@Component({
  selector: 'app-home-story',
  imports: [ScrollRevealDirective],
  host: { class: 'block' },
  templateUrl: './home-story.html',
  styleUrl: './home-story.css',
})
export class HomeStory {}
