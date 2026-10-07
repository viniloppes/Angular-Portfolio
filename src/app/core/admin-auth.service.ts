import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly supabase = inject(SupabaseClientService);

  get isConfigured(): boolean {
    return this.supabase.isConfigured;
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = await this.supabase.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Não foi possível iniciar a sessão.');
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured) return null;
    const client = await this.supabase.getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.access_token ?? null;
  }

  async hasSession(): Promise<boolean> {
    return Boolean(await this.getAccessToken());
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured) return;
    const client = await this.supabase.getClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
}
