import { Routes } from '@angular/router';
import { OperadorLayoutComponent } from './layout/operador-layout.component';

export const OPERADOR_ROUTES: Routes = [
  {
    path: '',
    component: OperadorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'mi-informacion',
        pathMatch: 'full'
      },
      {
        path: 'mi-informacion',
        loadComponent: () =>
          import('./pages/mi-informacion/mi-informacion.component').then((m) => m.MiInformacionComponent),
        title: 'Mi Información (Establecimiento) - PDHO'
      },
      {
        path: 'mis-formularios',
        loadComponent: () =>
          import('./pages/mis-formularios/mis-formularios.component').then((m) => m.MisFormulariosComponent),
        title: 'Mis Formularios - PDHO'
      },
      {
        path: 'formulario-1',
        loadComponent: () =>
          import('./pages/formulario-estadisticas/formulario-estadisticas.component').then(
            (m) => m.FormularioEstadisticasComponent
          ),
        title: 'Formulario 1: Estadísticas Hoteleras - PDHO'
      },
      {
        path: 'formulario-2',
        loadComponent: () =>
          import('./pages/formulario-ocupacion/formulario-ocupacion.component').then(
            (m) => m.FormularioOcupacionComponent
          ),
        title: 'Formulario 2: Ocupación Hotelera - PDHO'
      }
    ]
  }
];
