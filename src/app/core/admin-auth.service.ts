import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPortfolioRuntimeConfig } from './portfolio-config';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionStore = new Map<string, string>();
  private clientPromise: Promise<SupabaseClient> | null = null;

  get isConfigured(): boolean {
    const config = getPortfolioRuntimeConfig();
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = await this.getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('Não foi possível iniciar a sessão.');
  }

  async getAccessToken(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId) || !this.isConfigured) return null;
    const client = await this.getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.access_token ?? null;
  }

  async hasSession(): Promise<boolean> {
    return Boolean(await this.getAccessToken());
  }

  async signOut(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.isConfigured) return;
    const client = await this.getClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  private getClient(): Promise<SupabaseClient> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('A autenticação está disponível somente no navegador.');
    }
    if (!this.isConfigured) {
      throw new Error('Configure a URL do Supabase e a chave pública em public/portfolio-config.js.');
    }
    if (!this.clientPromise) {
      const config = getPortfolioRuntimeConfig();
      const storage = {
        getItem: async (key: string) => this.sessionStore.get(key) ?? null,
        setItem: async (key: string, value: string) => { this.sessionStore.set(key, value); },
        removeItem: async (key: string) => { this.sessionStore.delete(key); },
      };

      this.clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
        createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: {
            storage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }),
      );
    }
    return this.clientPromise;
  }
}
