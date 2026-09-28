import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getPortfolioRuntimeConfig } from './portfolio-config';
import { PortfolioCase, PortfolioCaseInput } from './portfolio-case';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);

  async getPublicCases(): Promise<PortfolioCase[]> {
    const cases = await firstValueFrom(this.http.get<PortfolioCase[]>(this.endpoint('/api/cases')));
    return this.orderCases(cases);
  }

  async getAdminCases(): Promise<PortfolioCase[]> {
    const cases = await firstValueFrom(this.http.get<PortfolioCase[]>(this.endpoint('/api/admin/cases')));
    return this.orderCases(cases);
  }

  async createCase(input: PortfolioCaseInput, thumbnail: File): Promise<PortfolioCase> {
    return firstValueFrom(
      this.http.post<PortfolioCase>(this.endpoint('/api/admin/cases'), this.toFormData(input, thumbnail)),
    );
  }

  async updateCase(id: string, input: PortfolioCaseInput, thumbnail?: File): Promise<PortfolioCase> {
    return firstValueFrom(
      this.http.put<PortfolioCase>(
        this.endpoint('/api/admin/cases/' + encodeURIComponent(id)),
        this.toFormData(input, thumbnail),
      ),
    );
  }

  async deleteCase(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(this.endpoint('/api/admin/cases/' + encodeURIComponent(id))),
    );
  }

  imageUrl(path: string): string {
    if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
    if (!path.startsWith('/uploads/')) return path;
    const base = getPortfolioRuntimeConfig().apiBaseUrl.replace(/\/+$/, '');
    return base ? base + path : path;
  }
  private endpoint(path: string): string {
    const base = getPortfolioRuntimeConfig().apiBaseUrl.replace(/\/+$/, '');
    return base + path;
  }

  private toFormData(input: PortfolioCaseInput, thumbnail?: File): FormData {
    const formData = new FormData();
    formData.append('name', input.name);
    formData.append('description', input.description);
    formData.append('category', input.category);
    formData.append('youtubeUrl', input.youtubeUrl);
    formData.append('gameUrl', input.gameUrl);
    formData.append('projectUrl', input.projectUrl);
    formData.append('sortOrder', String(input.sortOrder));
    if (thumbnail) formData.append('thumbnail', thumbnail, thumbnail.name);
    return formData;
  }

  private orderCases(cases: PortfolioCase[]): PortfolioCase[] {
    return [...cases].sort((a, b) => a.sortOrder - b.sortOrder);
  }
}


