import { inject, Injectable } from '@angular/core';
import { PortfolioCategory, PortfolioCategoryInput } from './portfolio-category';
import { SupabaseClientService } from './supabase-client.service';

interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  ativo: number;
}

@Injectable({ providedIn: 'root' })
export class PortfolioCategoryService {
  private readonly supabase = inject(SupabaseClientService);

  async getPublicCategories(): Promise<PortfolioCategory[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_categories')
      .select('id, name, description, created_at, updated_at, ativo')
      .eq('ativo', 1)
      .order('name', { ascending: true });

    if (error) throw error;
    return this.mapCategories(data as unknown as CategoryRecord[]);
  }

  async getAdminCategories(): Promise<PortfolioCategory[]> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_categories')
      .select('id, name, description, created_at, updated_at, ativo')
      .order('name', { ascending: true });

    if (error) throw error;
    return this.mapCategories(data as unknown as CategoryRecord[]);
  }

  async createCategory(input: PortfolioCategoryInput): Promise<PortfolioCategory> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_categories')
      .insert(this.toRecord(input))
      .select('id, name, description, created_at, updated_at, ativo')
      .single();

    if (error) throw error;
    return this.mapCategory(data as unknown as CategoryRecord);
  }

  async updateCategory(id: string, input: PortfolioCategoryInput): Promise<PortfolioCategory> {
    const client = await this.supabase.getClient();
    const { data, error } = await client
      .from('portfolio_categories')
      .update(this.toRecord(input))
      .eq('id', id)
      .select('id, name, description, created_at, updated_at, ativo')
      .single();

    if (error) throw error;
    return this.mapCategory(data as unknown as CategoryRecord);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    const client = await this.supabase.getClient();
    const { error } = await client
      .from('portfolio_categories')
      .update({ ativo: isActive ? 1 : 0 })
      .eq('id', id);

    if (error) throw error;
  }

  private toRecord(input: PortfolioCategoryInput): Pick<CategoryRecord, 'name' | 'description'> {
    return {
      name: input.name.trim(),
      description: input.description.trim() || null,
    };
  }

  private mapCategories(rows: CategoryRecord[]): PortfolioCategory[] {
    return rows.map((row) => this.mapCategory(row));
  }

  private mapCategory(row: CategoryRecord): PortfolioCategory {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.ativo === 1,
    };
  }
}
