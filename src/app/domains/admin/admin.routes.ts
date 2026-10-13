import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.component').then((m) => m.InicioComponent)
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/estadisticas/estadisticas.component').then((m) => m.EstadisticasComponent)
      },
      {
        path: 'cumplimiento',
        loadComponent: () => import('./pages/cumplimiento/cumplimiento.component').then((m) => m.CumplimientoComponent)
      },
      {
        path: 'establecimientos',
        loadComponent: () =>
          import('./pages/establecimientos/establecimientos.component').then((m) => m.EstablecimientosComponent)
      }
    ]
  }
];
