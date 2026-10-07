import { inject, Injectable } from '@angular/core';
import { PortfolioCase, PortfolioCaseInput } from './portfolio-case';
import { SupabaseClientService } from './supabase-client.service';

interface CaseRecord {
  id: string;
  name: string;
  description: string;
  category_id: string;
  thumbnail_path: string;
  youtube_url: string | null;
  game_url: string | null;
  project_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  ativo: number;
  portfolio_categories: { name: string; ativo?: number } | null;
}

const PUBLIC_CASE_FIELDS =
  'id, name, description, category_id, thumbnail_path, youtube_url, game_url, project_url, sort_order, created_at, updated_at, ativo, portfolio_categories!inner(name, ativo)';
const ADMIN_CASE_FIELDS =
  'id, name, description, category_id, thumbnail_path, youtube_url, game_url, project_url, sort_order, created_at, updated_at, ativo, portfolio_categories(name, ativo)';

@Injectable({ providedIn: 'root' })
export class PortfolioDataService {
  private readonly supabase = inject(SupabaseClientService);

  async getPublicCases(): Promise<PortfolioCase[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_cases')
      .select(PUBLIC_CASE_FIELDS)
      .eq('ativo', 1)
      .eq('portfolio_categories.ativo', 1)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return this.mapCases(data as unknown as CaseRecord[]);
  }

  async getAdminCases(): Promise<PortfolioCase[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_cases')
      .select(ADMIN_CASE_FIELDS)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return this.mapCases(data as unknown as CaseRecord[]);
  }

  async createCase(input: PortfolioCaseInput, thumbnail: File): Promise<PortfolioCase> {
    const client = await this.supabase.getClient();
    const thumbnailPath = await this.uploadThumbnail(client, thumbnail);
    const { data, error } = await client
      .from('portfolio_cases')
      .insert({ ...this.toRecord(input), thumbnail_path: thumbnailPath, ativo: 1 })
      .select(ADMIN_CASE_FIELDS)
      .single();

    if (error) throw error;
    return this.mapCase(data as unknown as CaseRecord);
  }

  async updateCase(id: string, input: PortfolioCaseInput, thumbnail?: File): Promise<PortfolioCase> {
    const client = await this.supabase.getClient();
    const thumbnailPath = thumbnail ? await this.uploadThumbnail(client, thumbnail) : undefined;
    const { data, error } = await client
      .from('portfolio_cases')
      .update({ ...this.toRecord(input), ...(thumbnailPath ? { thumbnail_path: thumbnailPath } : {}) })
      .eq('id', id)
      .select(ADMIN_CASE_FIELDS)
      .single();

    if (error) throw error;
    return this.mapCase(data as unknown as CaseRecord);
  }

  async setCaseActive(id: string, isActive: boolean): Promise<void> {
    const client = await this.supabase.getClient();
    const { error } = await client
      .from('portfolio_cases')
      .update({ ativo: isActive ? 1 : 0 })
      .eq('id', id);

    if (error) throw error;
  }

  imageUrl(path: string): string {
    return this.supabase.imageUrl(path);
  }

  private async uploadThumbnail(client: Awaited<ReturnType<SupabaseClientService['getClient']>>, file: File): Promise<string> {
    const extension = file.name.match(/\.[a-z0-9]{1,8}$/i)?.[0].toLowerCase() ?? '';
    const path = `cases/${crypto.randomUUID()}${extension}`;
    const { error } = await client.storage.from('portfolio-covers').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;
    return path;
  }

  private toRecord(input: PortfolioCaseInput) {
    return {
      name: input.name.trim(),
      description: input.description.trim(),
      category_id: input.categoryId,
      youtube_url: input.youtubeUrl.trim() || null,
      game_url: input.gameUrl.trim() || null,
      project_url: input.projectUrl.trim() || null,
      sort_order: input.sortOrder,
    };
  }

  private mapCases(rows: CaseRecord[]): PortfolioCase[] {
    return rows.map((row) => this.mapCase(row));
  }

  private mapCase(row: CaseRecord): PortfolioCase {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.portfolio_categories?.name ?? '',
      categoryId: row.category_id,
      thumbnailUrl: row.thumbnail_path,
      youtubeUrl: row.youtube_url,
      gameUrl: row.game_url,
      projectUrl: row.project_url,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.ativo === 1,
    };
  }
}
