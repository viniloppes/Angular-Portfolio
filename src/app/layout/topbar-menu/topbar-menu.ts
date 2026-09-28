import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-topbar-menu',
  imports: [RouterLink, RouterLinkActive],
  host: { class: 'block' },
  templateUrl: './topbar-menu.html',
})
export class TopbarMenu {}
