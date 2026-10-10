import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Se SSR for reativado, mantenha estas rotas no cliente: o adminGuard lê a sessão do localStorage.
  { path: 'admin/cases', renderMode: RenderMode.Client },
  { path: 'admin/categories', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
