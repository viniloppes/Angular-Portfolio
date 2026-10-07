import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPortfolioRuntimeConfig } from './portfolio-config';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly platformId = inject(PLATFORM_ID);
  private clientPromise: Promise<SupabaseClient> | null = null;

  get isConfigured(): boolean {
    const config = getPortfolioRuntimeConfig();
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  getClient(): Promise<SupabaseClient> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('O Supabase está disponível somente no navegador.');
    }

    const config = getPortfolioRuntimeConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Configure a URL do Supabase e a chave pública em public/portfolio-config.js.');
    }

    this.clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }),
    );

    return this.clientPromise;
  }

  imageUrl(path: string): string {
    if (!path || /^(https?:|data:|blob:)/i.test(path) || path.startsWith('/assets/')) return path;

    const { supabaseUrl } = getPortfolioRuntimeConfig();
    if (!supabaseUrl) return path;

    const encodedPath = path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
    return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/portfolio-covers/${encodedPath}`;
  }
}
