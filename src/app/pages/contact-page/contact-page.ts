import { ButtonModule } from 'primeng/button';
import { Component } from '@angular/core';

@Component({
  selector: 'app-contact-page',
  imports: [ButtonModule],
  host: { class: 'block' },
  templateUrl: './contact-page.html',
})
export class ContactPage {}
