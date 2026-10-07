export interface PortfolioRuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

declare global {
  interface Window {
    __PORTFOLIO_CONFIG__?: Partial<PortfolioRuntimeConfig>;
  }
}

const emptyConfig: PortfolioRuntimeConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

export function getPortfolioRuntimeConfig(): PortfolioRuntimeConfig {
  if (typeof window === 'undefined') return emptyConfig;
  return { ...emptyConfig, ...window.__PORTFOLIO_CONFIG__ };
}
