import { Routes } from '@angular/router';
import { authGuard } from './domains/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./domains/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./domains/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'operador',
    loadChildren: () => import('./domains/operador/operador.routes').then((m) => m.OPERADOR_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    redirectTo: 'operador/mi-informacion',
    pathMatch: 'full'
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
