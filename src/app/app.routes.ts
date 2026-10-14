import { Routes } from '@angular/router';
import { authGuard, roleGuard, rootGuard } from './domains/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./domains/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./domains/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard(['ADMIN_DEPARTAMENTAL'])]
  },
  {
    path: 'operador',
    loadChildren: () => import('./domains/operador/operador.routes').then((m) => m.OPERADOR_ROUTES),
    canActivate: [authGuard, roleGuard(['OPERADOR_HOSPEDAJE', 'DEPENDIENTE_HOSPEDAJE'])]
  },
  {
    path: 'dashboard',
    redirectTo: 'operador/mi-informacion',
    pathMatch: 'full'
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootGuard],
    children: []
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
