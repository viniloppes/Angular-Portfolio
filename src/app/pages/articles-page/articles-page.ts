import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-articles-page',
  imports: [RouterLink],
  host: { class: 'block' },
  templateUrl: './articles-page.html',
})
export class ArticlesPage {}
