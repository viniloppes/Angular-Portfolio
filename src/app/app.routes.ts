import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { Layout } from './layout/layout';
import { HomePage } from './pages/home-page/home-page';
import { ProjectsPage } from './pages/projects-page/projects-page';
import { ArticlesPage } from './pages/articles-page/articles-page';
import { ContactPage } from './pages/contact-page/contact-page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'admin', loadComponent: () => import('./pages/admin-login/admin-login').then((m) => m.AdminLoginPage), title: 'Entrar · AmberLink' },
  { path: 'admin/cases', loadComponent: () => import('./pages/admin-cases/admin-cases').then((m) => m.AdminCasesPage), canActivate: [adminGuard], title: 'Cases · AmberLink' },
  { path: 'admin/categories', loadComponent: () => import('./pages/admin-categories/admin-categories').then((m) => m.AdminCategoriesPage), canActivate: [adminGuard], title: 'Categorias · AmberLink' },
  {
    path: '',
    component: Layout,
    children: [
      { path: 'home', component: HomePage, pathMatch: 'full', title: 'AmberLink · Vinícius Lopes' },
      { path: 'projects', component: ProjectsPage, title: 'Projetos · AmberLink' },
      { path: 'articles', component: ArticlesPage, title: 'Artigos · AmberLink' },
      { path: 'contact', component: ContactPage, title: 'Contato · AmberLink' },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
