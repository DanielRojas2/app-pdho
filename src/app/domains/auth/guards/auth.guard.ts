import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.models';

/**
 * Retorna la ruta base de inicio adecuada según el rol del usuario autenticado.
 */
export function obtenerRutaInicioPorRol(rol?: RolUsuario | null): string {
  if (rol === 'OPERADOR_HOSPEDAJE' || rol === 'DEPENDIENTE_HOSPEDAJE') {
    return '/operador/mi-informacion';
  }
  return '/admin/inicio';
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }
  const rol = auth.userRole();
  return router.createUrlTree([obtenerRutaInicioPorRol(rol)]);
};

export const roleGuard = (rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const rol = auth.userRole();
    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }

    // Redirigir a la vista oficial que le corresponde a su rol
    return router.createUrlTree([obtenerRutaInicioPorRol(rol)]);
  };
};

export const rootGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  const rol = auth.userRole();
  return router.createUrlTree([obtenerRutaInicioPorRol(rol)]);
};
