import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { PwaService } from '../../../core/services/pwa.service';

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
  readonly pwa = inject(PwaService);

  readonly currentUser = this.authService.currentUser;
  readonly bannerInstalarCerrado = signal<boolean>(false);
  readonly mobileMenuOpen = signal<boolean>(false);

  constructor() {
    // Cerrar menú móvil al cambiar de ruta
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileMenuOpen.set(false);
    });
  }

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

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  instalarApp(): void {
    this.pwa.promptInstall();
  }

  cerrarBannerInstalar(): void {
    this.bannerInstalarCerrado.set(true);
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
