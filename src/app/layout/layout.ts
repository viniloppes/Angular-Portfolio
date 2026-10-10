import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarMenu } from './topbar-menu/topbar-menu';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, TopbarMenu],
  host: { class: 'forest-shell flex flex-col' },
  templateUrl: './layout.html',
})
export class Layout {}
