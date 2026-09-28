import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AdminAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  showPassword = false;
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  get isConfigured(): boolean {
    return this.auth.isConfigured;
  }

  async signIn(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.submitting.set(true);

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email, password);
      const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin/cases';
      const target = requestedUrl.startsWith('/') && requestedUrl !== '/admin' ? requestedUrl : '/admin/cases';
      await this.router.navigateByUrl(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      this.errorMessage.set(message.toLowerCase().includes('invalid login credentials')
        ? 'E-mail ou senha incorretos.'
        : message || 'Não foi possível entrar. Verifique a conexão e tente de novo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
