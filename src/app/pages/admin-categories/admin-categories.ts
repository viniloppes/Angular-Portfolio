import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, OnInit, PLATFORM_ID, ViewChild, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';
import { PortfolioCategory, PortfolioCategoryInput } from '../../core/portfolio-category';
import { PortfolioCategoryService } from '../../core/portfolio-category.service';

@Component({
  selector: 'app-admin-categories',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-categories.html',
  styleUrls: ['./admin-categories.css', '../admin-cases/admin-cases.css'],
})
export class AdminCategoriesPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoriesApi = inject(PortfolioCategoryService);
  private readonly auth = inject(AdminAuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  @ViewChild('categoryDialog') private categoryDialog?: ElementRef<HTMLDialogElement>;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: [''],
  });

  readonly categories = signal<PortfolioCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly busyCategoryId = signal('');
  readonly loadError = signal('');
  readonly formError = signal('');
  readonly statusMessage = signal('');
  editingCategory: PortfolioCategory | null = null;

  get activeCount(): string {
    return String(this.categories().filter((category) => category.isActive).length).padStart(2, '0');
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      this.categories.set(await this.categoriesApi.getAdminCategories());
    } catch (error) {
      this.loadError.set(this.describeError(error));
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.editingCategory = null;
    this.formError.set('');
    this.form.reset({ name: '', description: '' });
    this.openDialog();
  }

  openEdit(category: PortfolioCategory): void {
    this.editingCategory = category;
    this.formError.set('');
    this.form.reset({ name: category.name, description: category.description });
    this.openDialog();
  }

  closeEditor(): void {
    this.categoryDialog?.nativeElement.close();
  }

  handleDialogClick(event: MouseEvent): void {
    if (event.target === this.categoryDialog?.nativeElement) this.closeEditor();
  }

  async saveCategory(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    this.statusMessage.set('');

    try {
      const input = this.form.getRawValue() as PortfolioCategoryInput;
      if (this.editingCategory) {
        await this.categoriesApi.updateCategory(this.editingCategory.id, input);
        this.statusMessage.set('Categoria atualizada.');
      } else {
        await this.categoriesApi.createCategory(input);
        this.statusMessage.set('Categoria criada.');
      }

      this.closeEditor();
      await this.loadCategories();
    } catch (error) {
      this.formError.set(this.describeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  async setActive(category: PortfolioCategory, isActive: boolean): Promise<void> {
    if (!isActive && (!isPlatformBrowser(this.platformId) || !window.confirm(`Desativar "${category.name}"? A categoria poderá ser reativada depois.`))) return;

    this.busyCategoryId.set(category.id);
    this.statusMessage.set('');
    this.loadError.set('');

    try {
      await this.categoriesApi.setActive(category.id, isActive);
      this.statusMessage.set(isActive ? 'Categoria reativada.' : 'Categoria desativada.');
      await this.loadCategories();
    } catch (error) {
      this.loadError.set(this.describeError(error));
    } finally {
      this.busyCategoryId.set('');
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
    } finally {
      await this.router.navigateByUrl('/admin');
    }
  }

  private openDialog(): void {
    this.statusMessage.set('');
    queueMicrotask(() => this.categoryDialog?.nativeElement.showModal());
  }

  private describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const failure = error as { message: string; code?: string };
      if (failure.code === '23505') return 'Já existe uma categoria com esse nome.';
      if (failure.message.toLowerCase().includes('reatribua ou desative')) {
        return 'Desative ou reatribua os cases ativos antes de desativar esta categoria.';
      }
      if (failure.code === '42501') return 'Esta conta ainda não tem permissão de administrador.';
      return failure.message;
    }

    return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
