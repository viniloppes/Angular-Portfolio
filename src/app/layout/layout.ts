import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TopbarMenu } from './topbar-menu/topbar-menu';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterOutlet, TopbarMenu],
  host: { class: 'block' },
  templateUrl: './layout.html',
})
export class Layout {}
