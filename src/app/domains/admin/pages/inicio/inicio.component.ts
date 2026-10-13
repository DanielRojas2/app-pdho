import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-admin-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InicioComponent {
  readonly authService = inject(AuthService);

  readonly kpis = signal([
    {
      titulo: 'Establecimientos Registrados',
      valor: '54',
      subtexto: 'Hoteles, residenciales y alojamientos en Oruro',
      icono: 'hotel',
      color: 'carmesi'
    },
    {
      titulo: 'Formularios Declarados (Mes Activo)',
      valor: '43',
      subtexto: '79.6% de cobertura de presentación',
      icono: 'clipboard',
      color: 'emerald'
    },
    {
      titulo: 'Total Huéspedes Registrados',
      valor: '16,420',
      subtexto: 'Nacionales y extranjeros consolidados',
      icono: 'users',
      color: 'blue'
    },
    {
      titulo: 'Pernoctaciones Acumuladas',
      valor: '32,150',
      subtexto: 'Noches totales de estadía en el departamento',
      icono: 'moon',
      color: 'amber'
    }
  ]);

  readonly ultimosFormularios = signal([
    { hotel: 'Hotel Eden by Bluebay', categoria: '5 Estrellas', mes: 'Octubre 2026', estado: 'APROBADO', fecha: '12/10/2026' },
    { hotel: 'Gran Sucre Hotel', categoria: '3 Estrellas', mes: 'Octubre 2026', estado: 'APROBADO', fecha: '11/10/2026' },
    { hotel: 'Hotel Terminal Oruro', categoria: '3 Estrellas', mes: 'Octubre 2026', estado: 'ENVIADO', fecha: '10/10/2026' },
    { hotel: 'Alojamiento San José', categoria: 'Alojamiento', mes: 'Octubre 2026', estado: 'OBSERVADO', fecha: '09/10/2026' },
    { hotel: 'Residencial América', categoria: 'Residencial', mes: 'Octubre 2026', estado: 'APROBADO', fecha: '08/10/2026' }
  ]);
}
