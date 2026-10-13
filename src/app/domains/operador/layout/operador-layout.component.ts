import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-operador-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './operador-layout.component.html',
  styleUrl: './operador-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperadorLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  readonly userEmail = computed(() => {
    return this.currentUser()?.email ?? 'usuario@hotel.bo';
  });

  readonly userRoleLabel = computed(() => {
    const rol = this.currentUser()?.rol;
    if (rol === 'OPERADOR_HOSPEDAJE') return 'Operador';
    if (rol === 'DEPENDIENTE_HOSPEDAJE') return 'Dependiente';
    return 'Usuario';
  });

  // Período Activo dinámico reconocido por el calendario de sistema del usuario
  readonly activePeriod = computed(() => {
    const now = new Date();
    const mes = now.toLocaleString('es-ES', { month: 'long' });
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    const gestion = now.getFullYear();
    return `${mesCapitalizado} / ${gestion}`;
  });

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
