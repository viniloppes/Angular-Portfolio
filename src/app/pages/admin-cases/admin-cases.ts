import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, OnInit, PLATFORM_ID, ViewChild, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';
import { PortfolioCategory } from '../../core/portfolio-category';
import { PortfolioCategoryService } from '../../core/portfolio-category.service';
import { PortfolioDataService } from '../../core/portfolio-data.service';
import { PortfolioCase, PortfolioCaseInput } from '../../core/portfolio-case';

function optionalHttpsUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;

  try {
    return new URL(value).protocol === 'https:' ? null : { httpsUrl: true };
  } catch {
    return { httpsUrl: true };
  }
}

function optionalYouTubeUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'))
      ? null
      : { youtubeUrl: true };
  } catch {
    return { youtubeUrl: true };
  }
}

@Component({
  selector: 'app-admin-cases',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-cases.html',
  styleUrl: './admin-cases.css',
})
export class AdminCasesPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly portfolio = inject(PortfolioDataService);
  private readonly categoryService = inject(PortfolioCategoryService);
  private readonly auth = inject(AdminAuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  @ViewChild('editorDialog') private editorDialog?: ElementRef<HTMLDialogElement>;
  @ViewChild('thumbnailInput') private thumbnailInput?: ElementRef<HTMLInputElement>;

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.maxLength(10000)]],
    categoryId: ['', Validators.required],
    youtubeUrl: ['', optionalYouTubeUrl],
    gameUrl: ['', optionalHttpsUrl],
    projectUrl: ['', optionalHttpsUrl],
    sortOrder: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
  });

  readonly cases = signal<PortfolioCase[]>([]);
  readonly categories = signal<PortfolioCategory[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatingStatusId = signal('');
  readonly loadError = signal('');
  readonly categoryLoadError = signal('');
  readonly formError = signal('');
  readonly statusMessage = signal('');
  editorMode: 'create' | 'edit' = 'create';
  editingCase: PortfolioCase | null = null;
  selectedThumbnail: File | null = null;
  thumbnailPreview = '';
  thumbnailError = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void Promise.all([this.loadCases(), this.loadCategories()]);
  }

  imageUrl(path: string): string {
    return this.portfolio.imageUrl(path);
  }

  get selectableCategories(): PortfolioCategory[] {
    const selectedId = this.editingCase?.categoryId;
    return this.categories().filter((category) => category.isActive || category.id === selectedId);
  }
  get caseCount(): string {
    return String(this.cases().length).padStart(2, '0');
  }

  async loadCases(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      this.cases.set(await this.portfolio.getAdminCases());
    } catch (error) {
      this.loadError.set(this.describeError(error));
    } finally {
      this.loading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    this.categoryLoadError.set('');

    try {
      this.categories.set(await this.categoryService.getAdminCategories());
    } catch (error) {
      this.categoryLoadError.set(this.describeError(error));
    }
  }

  openCreate(): void {
    this.editorMode = 'create';
    this.editingCase = null;
    this.selectedThumbnail = null;
    this.thumbnailError = '';
    this.formError.set('');
    this.releasePreview();
    if (this.thumbnailInput) this.thumbnailInput.nativeElement.value = '';
    this.form.reset({
      name: '',
      description: '',
      categoryId: this.categories().find((category) => category.isActive)?.id ?? '',
      youtubeUrl: '',
      gameUrl: '',
      projectUrl: '',
      sortOrder: this.cases().length ? Math.max(...this.cases().map((item) => item.sortOrder)) + 1 : 1,
    });
    this.openDialog();
  }

  openEdit(item: PortfolioCase): void {
    this.editorMode = 'edit';
    this.editingCase = item;
    this.selectedThumbnail = null;
    this.thumbnailError = '';
    this.formError.set('');
    this.releasePreview();
    if (this.thumbnailInput) this.thumbnailInput.nativeElement.value = '';
    this.thumbnailPreview = this.portfolio.imageUrl(item.thumbnailUrl);
    this.form.reset({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      youtubeUrl: item.youtubeUrl ?? '',
      gameUrl: item.gameUrl ?? '',
      projectUrl: item.projectUrl ?? '',
      sortOrder: item.sortOrder,
    });
    this.openDialog();
  }

  closeEditor(): void {
    this.editorDialog?.nativeElement.close();
    this.selectedThumbnail = null;
    if (this.thumbnailInput) this.thumbnailInput.nativeElement.value = '';
    this.releasePreview();
  }

  onEditorClosed(): void {
    this.selectedThumbnail = null;
    if (this.thumbnailInput) this.thumbnailInput.nativeElement.value = '';
    this.releasePreview();
  }

  handleEditorClick(event: MouseEvent): void {
    if (event.target === this.editorDialog?.nativeElement) this.closeEditor();
  }

  chooseThumbnail(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.thumbnailError = '';

    if (!file) return;

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      this.selectedThumbnail = null;
      this.releasePreview();
      this.thumbnailError = 'Escolha uma imagem JPG, PNG, WebP ou GIF.';
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.selectedThumbnail = null;
      this.releasePreview();
      this.thumbnailError = 'A imagem precisa ter no máximo 10 MB.';
      input.value = '';
      return;
    }

    this.releasePreview();
    this.selectedThumbnail = file;
    this.thumbnailPreview = URL.createObjectURL(file);
  }

  async saveCase(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.editorMode === 'create' && !this.selectedThumbnail) {
      this.thumbnailError = 'Adicione uma imagem de capa para criar o case.';
      return;
    }

    this.formError.set('');
    this.statusMessage.set('');
    this.saving.set(true);

    try {
      const input = this.form.getRawValue() as PortfolioCaseInput;
      if (this.editorMode === 'edit' && this.editingCase) {
        await this.portfolio.updateCase(this.editingCase.id, input, this.selectedThumbnail ?? undefined);
        this.statusMessage.set('Case atualizado.');
      } else if (this.selectedThumbnail) {
        await this.portfolio.createCase(input, this.selectedThumbnail);
        this.statusMessage.set('Case criado e publicado.');
      }

      this.closeEditor();
      await this.loadCases();
    } catch (error) {
      this.formError.set(this.describeError(error));
    } finally {
      this.saving.set(false);
    }
  }

  async setCaseActive(item: PortfolioCase, isActive: boolean): Promise<void> {
    if (!isActive && (!isPlatformBrowser(this.platformId) || !window.confirm('Desativar "' + item.name + '"? O case poderá ser reativado depois.'))) return;

    this.updatingStatusId.set(item.id);
    this.statusMessage.set('');
    this.loadError.set('');

    try {
      await this.portfolio.setCaseActive(item.id, isActive);
      this.statusMessage.set(isActive ? 'Case reativado.' : 'Case desativado.');
      await this.loadCases();
    } catch (error) {
      this.loadError.set(this.describeError(error));
    } finally {
      this.updatingStatusId.set('');
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
    queueMicrotask(() => this.editorDialog?.nativeElement.showModal());
  }

  private releasePreview(): void {
    if (this.thumbnailPreview.startsWith('blob:')) URL.revokeObjectURL(this.thumbnailPreview);
    this.thumbnailPreview = '';
  }

  private describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const failure = error as { message: string; code?: string };
      if (failure.code === '42501') return 'Esta conta ainda não tem permissão de administrador.';
      if (failure.message.toLowerCase().includes('jwt expired')) return 'Sua sessão expirou. Entre novamente para continuar.';
      return failure.message;
    }

    return error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.';
  }
}


