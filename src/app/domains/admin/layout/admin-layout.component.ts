import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);

  readonly userEmail = computed(() => {
    return this.authService.currentUser()?.email || 'admin@oruro.gob.bo';
  });

  readonly userRoleLabel = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    if (rol === 'ADMIN_DEPARTAMENTAL') return 'Admin';
    if (rol === 'OPERADOR_HOSPEDAJE') return 'Operador';
    return 'Usuario';
  });

  readonly activePeriod = computed(() => {
    const now = new Date();
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[now.getMonth()]} / ${now.getFullYear()}`;
  });

  onLogout(): void {
    this.authService.logout();
  }
}
